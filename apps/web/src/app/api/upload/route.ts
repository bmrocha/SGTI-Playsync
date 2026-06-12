import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { ReadableStream } from 'stream/web';
import { query } from '@playsync/database';
import { verifyToken } from '@/lib/auth';
import { getSystemSettings } from '@/lib/system-settings';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';
import { ensureUploadDir } from '@/lib/upload-path';

// Configure body size limit for file uploads (1GB)
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max for large uploads
export const sizeLimit = '1024mb';

const ENVIRONMENT = process.env.NODE_ENV || 'development';
const UPLOAD_DIR = ensureUploadDir();

async function ensureMediaLibraryTable() {
  try {
    await query(`
            CREATE TABLE IF NOT EXISTS media_library (
                id UUID PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                size BIGINT NOT NULL,
                path VARCHAR(512) NOT NULL,
                url VARCHAR(512) NOT NULL,
                environment VARCHAR(50) NOT NULL,
                uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL
            );
        `);
  } catch {
    await query(`
            CREATE TABLE IF NOT EXISTS media_library (
                id UUID PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                size BIGINT NOT NULL,
                path VARCHAR(512) NOT NULL,
                url VARCHAR(512) NOT NULL,
                environment VARCHAR(50) NOT NULL,
                uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL
            );
        `);
  }

  try {
    await query(
      `CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_at ON media_library(uploaded_at DESC);`,
    );
  } catch {}
  try {
    await query(
      `CREATE INDEX IF NOT EXISTS idx_media_library_mime_type ON media_library(mime_type);`,
    );
  } catch {}
}

function toPositiveInt(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(n)) return null;
  const asInt = Math.floor(n);
  if (asInt <= 0) return null;
  return asInt;
}

const MAGIC_BYTES: Record<string, number[][]> = {
  '.jpg': [[0xff, 0xd8, 0xff]],
  '.jpeg': [[0xff, 0xd8, 0xff]],
  '.png': [[0x89, 0x50, 0x4e, 0x47]],
  '.webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  '.gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  '.mp4': [], // Validated via ftyp check at offset 4 (see lines 115-119)
  '.m4v': [], // Validated via ftyp check at offset 4 (same as MP4)
  '.webm': [[0x1a, 0x45, 0xdf, 0xa3]],
  '.mov': [], // Validated via ftyp check at offset 4 (see lines 115-119)
  '.mkv': [[0x1a, 0x45, 0xdf, 0xa3]], // Same magic bytes as WebM (EBML header)
  '.avi': [[0x52, 0x49, 0x46, 0x46]], // RIFF header (checked at offset 0)
  '.wmv': [[0x30, 0x26, 0xb2, 0x75]], // ASF header
  '.flv': [[0x46, 0x4c, 0x56]], // FLV header
  '.ogg': [[0x4f, 0x67, 0x67, 0x53]], // Ogg header
};

function validateFileMagicBytes(filepath: string, extLower: string): boolean {
  const magicList = MAGIC_BYTES[extLower];
  if (!magicList) {
    logger.warn({ extLower, filepath }, 'Unknown file extension for magic bytes validation');
    return false;
  }

  let fd: number | null = null;
  try {
    fd = fs.openSync(filepath, 'r');
    const buf = Buffer.alloc(16);
    const bytesRead = fs.readSync(fd, buf, 0, 16, 0);

    if (bytesRead < 4) {
      logger.warn({ bytesRead, filepath }, 'File too small for magic bytes validation');
      return false;
    }

    // Special case: MP4/MOV/M4V — check ftyp at offset 4
    if (extLower === '.mp4' || extLower === '.mov' || extLower === '.m4v') {
      if (bytesRead >= 8) {
        const ftyp = Buffer.from([0x66, 0x74, 0x79, 0x70]); // 'ftyp'
        if (buf.subarray(4, 8).equals(ftyp)) {
          return true;
        }
      }
      // If ftyp not found at offset 4, file is not valid MP4/MOV
      return false;
    }

    // Check standard magic bytes at offset 0
    for (const magic of magicList) {
      if (magic.length <= bytesRead) {
        let match = true;
        for (let i = 0; i < magic.length; i++) {
          if (buf[i] !== magic[i]) {
            match = false;
            break;
          }
        }
        if (match) return true;
      }
    }

    return false;
  } catch (error) {
    logger.error({ err: error, filepath }, 'Error validating file magic bytes');
    return false;
  } finally {
    if (fd !== null) {
      fs.closeSync(fd);
    }
  }
}

export async function POST(request: NextRequest) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    // Authenticate user
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.id as string;

    // Parse FormData with better error handling
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      logger.error({ err: error }, '[Upload] Failed to parse FormData');
      return NextResponse.json(
        {
          error:
            'Falha ao processar o upload. Verifique se o arquivo nao excede o limite e tente novamente.',
        },
        { status: 400 },
      );
    }

    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const originalName = file.name;
    const extension = path.extname(originalName);
    const extLower = extension.toLowerCase();
    const isVideo =
      file.type?.startsWith('video') ||
      ['.mp4', '.webm', '.mov', '.mkv', '.m4v', '.avi', '.wmv', '.flv', '.ogg'].includes(extLower);

    const settings = await getSystemSettings();
    const defaultImageLimitMb = 500;
    const defaultVideoLimitMb = 1024;
    const limitMb = isVideo
      ? (toPositiveInt(settings.uploadLimitVideo) ?? defaultVideoLimitMb)
      : (toPositiveInt(settings.uploadLimit) ?? defaultImageLimitMb);
    const maxSize = limitMb * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Arquivo excede o limite de ${limitMb}MB` },
        { status: 413 },
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomString}${extension}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Stream file directly to disk — evita carregar o arquivo inteiro na RAM
    const webStream = file.stream() as ReadableStream;
    const readable = Readable.fromWeb(webStream);
    await pipeline(readable, fs.createWriteStream(filepath));

    // Validate magic bytes (tipo real do arquivo, nao confiar apenas na extensao)
    const validTypes = validateFileMagicBytes(filepath, extLower);
    if (!validTypes) {
      fs.unlinkSync(filepath);
      return NextResponse.json(
        {
          error:
            'Tipo de arquivo nao permitido. Apenas imagens (jpg, png, webp, gif) e videos (mp4, webm, mov) sao aceitos.',
        },
        { status: 400 },
      );
    }

    // Generate public URL
    const publicUrl = `/uploads/${filename}`;

    // Save metadata to database
    const fileSize = file.size;
    const mimeType = (() => {
      if (file.type) return file.type;
      const map: Record<string, string> = {
        '.mp4': 'video/mp4',
        '.m4v': 'video/mp4',
        '.webm': 'video/webm',
        '.mov': 'video/quicktime',
        '.mkv': 'video/x-matroska',
        '.avi': 'video/x-msvideo',
        '.wmv': 'video/x-ms-wmv',
        '.flv': 'video/x-flv',
        '.ogg': 'video/ogg',
      };
      return map[extLower] || 'application/octet-stream';
    })();

    await ensureMediaLibraryTable();

    const mediaId = crypto.randomUUID();
    const insertQuery = `
            INSERT INTO media_library (
                id,
                filename, 
                original_name, 
                mime_type, 
                size, 
                path, 
                url, 
                environment, 
                uploaded_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, uploaded_at
        `;

    const result = await query(insertQuery, [
      mediaId,
      filename,
      originalName,
      mimeType,
      fileSize,
      filepath,
      publicUrl,
      ENVIRONMENT,
      userId,
    ]);

    const newMedia = result.rows[0];

    logServerAction({
      userId,
      userName: userId,
      userRole: ((payload as Record<string, unknown>).role as string) || 'user',
      action: 'UPLOAD',
      resource: 'media',
      details: `Arquivo ${originalName} enviado (${fileSize} bytes)`,
      resourceId: newMedia.id,
      resourceName: originalName,
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: originalName,
      id: newMedia.id,
      uploaded_at: newMedia.uploaded_at,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    logger.error(
      {
        err: error,
        message: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString(),
      },
      'Upload error:',
    );

    // Return more specific error messages based on error type
    if (errorMessage.includes('EACCES') || errorMessage.includes('permission')) {
      return NextResponse.json(
        { error: 'Erro de permissão no servidor. Verifique as permissões da pasta de uploads.' },
        { status: 500 },
      );
    }

    if (errorMessage.includes('ENOSPC') || errorMessage.includes('no space')) {
      return NextResponse.json(
        { error: 'Espaço em disco insuficiente no servidor.' },
        { status: 500 },
      );
    }

    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('database')) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados. Tente novamente em alguns segundos.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: `Falha no upload: ${errorMessage}` }, { status: 500 });
  }
}

// GET - List uploaded files (optional, for debugging)
export async function GET(request: NextRequest) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const files = fs.readdirSync(UPLOAD_DIR);
    return NextResponse.json({ files, environment: ENVIRONMENT });
  } catch {
    return NextResponse.json({ files: [], environment: ENVIRONMENT });
  }
}
