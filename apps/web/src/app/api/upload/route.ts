import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { query } from '@playsync/database';
import { verifyToken } from '@/lib/auth';
import { getSystemSettings } from '@/lib/system-settings';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';
import { ensureUploadDir } from '@/lib/upload-path';
import Busboy from 'busboy';

// Configure route for file uploads
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 120 seconds max for large uploads

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

/**
 * Parse multipart form data using Busboy with streaming directly to disk.
 * This avoids loading the entire file into memory.
 */
function parseAndStreamFile(
  request: NextRequest,
  maxSizeBytes: number,
  uploadDir: string,
): Promise<{
  filepath: string | null;
  filename: string;
  fileSize: number;
  mimeType: string;
  error?: string;
}> {
  return new Promise((resolve) => {
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      resolve({
        filepath: null,
        filename: '',
        fileSize: 0,
        mimeType: '',
        error: 'Invalid content type',
      });
      return;
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    let tempFilename = '';
    let tempFilepath = '';
    let writeStream: fs.WriteStream | null = null;
    let fileSize = 0;
    let mimeType = '';
    let originalName = '';
    let resolved = false;

    const busboy = Busboy({
      headers: { 'content-type': contentType },
      limits: {
        fileSize: maxSizeBytes,
        files: 1,
      },
    });

    busboy.on('file', (_fieldname, fileStream, info) => {
      originalName = info.filename;
      mimeType = info.mimeType;
      const extension = path.extname(originalName);
      tempFilename = `${timestamp}-${randomString}${extension}`;
      tempFilepath = path.join(uploadDir, tempFilename);

      writeStream = fs.createWriteStream(tempFilepath);

      fileStream.on('data', (chunk) => {
        fileSize += chunk.length;
      });

      fileStream.on('limit', () => {
        if (writeStream) {
          writeStream.destroy();
        }
        if (!resolved) {
          resolved = true;
          fs.unlink(tempFilepath, () => {}); // Clean up partial file
          resolve({
            filepath: null,
            filename: '',
            fileSize: 0,
            mimeType: '',
            error: `File size exceeds limit of ${Math.round(maxSizeBytes / 1024 / 1024)}MB`,
          });
        }
      });

      fileStream.pipe(writeStream);

      writeStream.on('finish', () => {
        if (!resolved) {
          resolved = true;
          resolve({
            filepath: tempFilepath,
            filename: originalName,
            fileSize,
            mimeType,
          });
        }
      });

      writeStream.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          logger.error({ err }, '[Upload] Write stream error');
          fs.unlink(tempFilepath, () => {});
          resolve({
            filepath: null,
            filename: '',
            fileSize: 0,
            mimeType: '',
            error: 'Failed to write file to disk',
          });
        }
      });
    });

    busboy.on('error', (err: Error) => {
      if (!resolved) {
        resolved = true;
        logger.error({ err }, '[Upload] Busboy error');
        if (tempFilepath) {
          fs.unlink(tempFilepath, () => {});
        }
        resolve({
          filepath: null,
          filename: '',
          fileSize: 0,
          mimeType: '',
          error: err.message,
        });
      }
    });

    busboy.on('finish', () => {
      if (!resolved) {
        resolved = true;
        resolve({
          filepath: null,
          filename: '',
          fileSize: 0,
          mimeType: '',
          error: 'No file provided',
        });
      }
    });

    // Pipe the raw request body to busboy
    const reader = request.body?.getReader();
    if (!reader) {
      if (!resolved) {
        resolved = true;
        resolve({ filepath: null, filename: '', fileSize: 0, mimeType: '', error: 'No body' });
      }
      return;
    }

    const push = async () => {
      try {
        const { done, value } = await reader.read();
        if (done) {
          busboy.end();
          return;
        }
        busboy.write(value);
        push();
      } catch (err) {
        if (!resolved) {
          resolved = true;
          busboy.emit('error', err);
        }
      }
    };

    push();
  });
}

export async function POST(request: NextRequest) {
  const _lc = await requireLicense();
  if (_lc) return _lc;

  const startTime = Date.now();
  logger.info('[Upload] Starting upload process');

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
    logger.info({ userId }, '[Upload] User authenticated');

    // Get system settings to determine max upload size
    const settings = await getSystemSettings();
    const defaultVideoLimitMb = 1024;
    const limitMb = toPositiveInt(settings.uploadLimitVideo) ?? defaultVideoLimitMb;
    const maxSizeBytes = limitMb * 1024 * 1024;

    logger.info(
      { maxSizeMb: limitMb },
      '[Upload] Parsing FormData with Busboy and streaming to disk',
    );
    const parseStart = Date.now();

    // Parse and stream file directly to disk (no memory buffer)
    const {
      filepath,
      filename,
      fileSize,
      mimeType,
      error: parseError,
    } = await parseAndStreamFile(request, maxSizeBytes, UPLOAD_DIR);

    logger.info({ duration: Date.now() - parseStart }, '[Upload] FormData parsing completed');

    if (parseError) {
      logger.error({ error: parseError }, '[Upload] Failed to parse FormData');

      // Provide more specific error messages
      let errorMessage =
        'Falha ao processar o upload. Verifique se o arquivo nao excede o limite e tente novamente.';
      if (parseError.includes('memory') || parseError.includes('buffer')) {
        errorMessage = `Arquivo muito grande. O limite atual e de ${limitMb}MB. Entre em contato com o suporte se precisar de um limite maior.`;
      } else if (parseError.includes('timeout')) {
        errorMessage = 'Upload expirou. Verifique sua conexao e tente novamente.';
      } else if (parseError.includes('content-type') || parseError.includes('Invalid')) {
        errorMessage = 'Formato de arquivo invalido. Use o formato multipart/form-data.';
      } else if (parseError.includes('exceeds limit')) {
        errorMessage = parseError;
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? parseError : undefined,
        },
        { status: 400 },
      );
    }

    if (!filepath) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    logger.info(
      { fileName: filename, fileSize, fileType: mimeType },
      '[Upload] File received and saved to disk',
    );

    const extension = path.extname(filename);
    const extLower = extension.toLowerCase();
    const isVideo =
      mimeType?.startsWith('video') ||
      ['.mp4', '.webm', '.mov', '.mkv', '.m4v', '.avi', '.wmv', '.flv', '.ogg'].includes(extLower);

    // Validate file size against settings
    const defaultImageLimitMb = 500;
    const videoLimitMb = toPositiveInt(settings.uploadLimitVideo) ?? defaultVideoLimitMb;
    const imageLimitMb = toPositiveInt(settings.uploadLimit) ?? defaultImageLimitMb;
    const maxAllowedSize = isVideo ? videoLimitMb * 1024 * 1024 : imageLimitMb * 1024 * 1024;

    if (fileSize > maxAllowedSize) {
      fs.unlinkSync(filepath);
      return NextResponse.json(
        { error: `Arquivo excede o limite de ${isVideo ? videoLimitMb : imageLimitMb}MB` },
        { status: 413 },
      );
    }

    // Validate magic bytes (tipo real do arquivo, nao confiar apenas na extensao)
    logger.info({ filepath, extLower }, '[Upload] Validating magic bytes');
    const magicStart = Date.now();
    const validTypes = validateFileMagicBytes(filepath, extLower);
    logger.info(
      { duration: Date.now() - magicStart, valid: validTypes },
      '[Upload] Magic bytes validation completed',
    );

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
    const publicUrl = `/uploads/${path.basename(filepath)}`;

    // Save metadata to database
    await ensureMediaLibraryTable();

    const mediaId = crypto.randomUUID();
    logger.info({ mediaId }, '[Upload] Saving to database');
    const dbStart = Date.now();
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
      path.basename(filepath),
      filename,
      mimeType,
      fileSize,
      filepath,
      publicUrl,
      ENVIRONMENT,
      userId,
    ]);
    logger.info({ duration: Date.now() - dbStart }, '[Upload] Database insert completed');

    const newMedia = result.rows[0];

    logServerAction({
      userId,
      userName: userId,
      userRole: ((payload as Record<string, unknown>).role as string) || 'user',
      action: 'UPLOAD',
      resource: 'media',
      details: `Arquivo ${filename} enviado (${fileSize} bytes)`,
      resourceId: newMedia.id,
      resourceName: filename,
    });

    const totalTime = Date.now() - startTime;
    logger.info({ totalTime }, '[Upload] Upload completed successfully');

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename,
      id: newMedia.id,
      uploaded_at: newMedia.uploaded_at,
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    logger.error(
      {
        err: error,
        message: errorMessage,
        stack: errorStack,
        totalTime,
        timestamp: new Date().toISOString(),
      },
      '[Upload] Upload failed:',
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
