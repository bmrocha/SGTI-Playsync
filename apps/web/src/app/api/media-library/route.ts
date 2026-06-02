import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@playsync/database';
import { getCurrentUser } from '@/lib/server-auth';
import fs from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';
import { resolveUploadDir } from '@/lib/upload-path';

async function ensureMediaLibraryTable() {
  try {
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
  } catch {}

  try {
    await query(`
            CREATE TABLE IF NOT EXISTS media_library (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    try {
      await query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    } catch {}
    await query(`
            CREATE TABLE IF NOT EXISTS media_library (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

export async function GET(request: NextRequest) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    await ensureMediaLibraryTable();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // image, video, audio
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let whereSql = ` WHERE 1=1`;
    const params: Array<string | number> = [];
    let paramIndex = 1;

    if (type) {
      whereSql += ` AND mime_type LIKE $${paramIndex}`;
      params.push(`${type}%`);
      paramIndex++;
    }

    if (search) {
      whereSql += ` AND (original_name ILIKE $${paramIndex} OR filename ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Count total
    const countSql = `SELECT COUNT(*) FROM media_library` + whereSql;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count);

    // Fetch data
    const selectSql = `
            SELECT 
                *,
                COALESCE(
                    (SELECT json_agg(item) FROM (
                        SELECT DISTINCT
                            p.name AS playlist_name,
                            p.id::text AS playlist_id,
                            c.name AS company_name,
                            c.id::text AS company_id
                        FROM media_items mi
                        JOIN playlists p ON mi.playlist_id = p.id
                        LEFT JOIN company_playlists cp ON cp.playlist_id = p.id
                        LEFT JOIN companies c ON cp.company_id = c.id
                        WHERE mi.url = media_library.url
                    ) item),
                    '[]'::json
                ) as usage
            FROM media_library
        `;

    const dataSql =
      selectSql +
      whereSql +
      ` ORDER BY uploaded_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const res = await query(dataSql, params);

    return NextResponse.json({
      data: res.rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching media library:');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    await ensureMediaLibraryTable();
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // Get file info first
    const fileRes = await query('SELECT * FROM media_library WHERE id = $1', [id]);
    if (fileRes.rows.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const file = fileRes.rows[0];

    // Delete from DB
    await query('DELETE FROM media_library WHERE id = $1', [id]);

    // Delete from disk
    // path is stored in DB usually as absolute path or relative
    // Based on upload route: const filepath = path.join(UPLOAD_DIR, filename);
    // And it saves 'path' column.

    logServerAction({
      userId: currentUser.id,
      userName: currentUser.name || currentUser.email,
      userRole: currentUser.role,
      action: 'DELETE',
      resource: 'media',
      details: `Arquivo ${file.original_name} removido`,
      resourceId: id,
      resourceName: file.original_name,
    });

    let deleted = false;

    if (file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
        deleted = true;
      } catch (e) {
        logger.error({ err: e }, 'Error deleting file from disk (stored path):');
      }
    }

    if (!deleted && file.filename) {
      const fallbackPath = path.join(resolveUploadDir(), file.filename);
      if (fs.existsSync(fallbackPath)) {
        try {
          fs.unlinkSync(fallbackPath);
        } catch (e) {
          logger.error({ err: e }, 'Error deleting file from disk (fallback path):');
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Error deleting media:');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
