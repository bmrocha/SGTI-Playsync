import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { query } from '@playsync/database';
import { verifyToken } from '@/lib/auth';
import { getSystemSettings } from '@/lib/system-settings';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';
import { ensureUploadDir } from '@/lib/upload-path';

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
  '.mp4': [
    [0x00, 0x00, 0x00],
    [0x66, 0x74, 0x79, 0x70],
  ], // ftyp box (offset 4)
  '.webm': [[0x1a, 0x45, 0xdf, 0xa3]],
  '.mov': [
    [0x00, 0x00, 0x00],
    [0x66, 0x74, 0x79, 0x70],
  ], // ftyp box (offset 4)
};

function validateFileMagicBytes(filepath: string, extLower: string): boolean {
  const magicList = MAGIC_BYTES[extLower];
  if (!magicList) return false;

  const fd = fs.openSync(filepath, 'r');
  try {
    const buf = Buffer.alloc(16);
    const bytesRead = fs.readSync(fd, buf, 0, 16, 0);
    if (bytesRead < 4) return false;

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

    // Special case: MP4/MOV — check ftyp at offset 4
    if (extLower === '.mp4' || extLower === '.mov') {
      if (bytesRead >= 8) {
        const ftyp = Buffer.from([0x66, 0x74, 0x79, 0x70]);
        if (buf.subarray(4, 8).equals(ftyp)) return true;
      }
    }

    return false;
  } finally {
    fs.closeSync(fd);
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

    const formData = await request.formData();
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
    const webStream = (file as any).stream();
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
      userRole: (payload as any).role || 'user',
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
    logger.error({ err: error }, 'Upload error:');
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
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
  } catch (error) {
    return NextResponse.json({ files: [], environment: ENVIRONMENT });
  }
}
