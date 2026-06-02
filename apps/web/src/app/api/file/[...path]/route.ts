import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { resolveUploadDir } from '@/lib/upload-path';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.wmv': 'video/x-ms-wmv',
  '.flv': 'video/x-flv',
  '.ogg': 'video/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: pathSegments } = await params;
    const relativePath = pathSegments.join('/');
    const uploadDir = resolveUploadDir();

    // Normaliza e resolve o caminho absoluto do arquivo solicitado
    const requestedPath = path.normalize(path.join(uploadDir, relativePath));

    // Segurança: evita directory traversal (path traversal)
    if (!requestedPath.startsWith(uploadDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (!fs.existsSync(requestedPath)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const stat = fs.statSync(requestedPath);
    if (!stat.isFile()) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const ext = path.extname(requestedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Stream o arquivo ao invés de carregar tudo em memória
    const nodeStream = fs.createReadStream(requestedPath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(stat.size),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('[File API] Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
