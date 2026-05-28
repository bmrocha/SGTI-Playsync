import { requireLicense } from '@/lib/license-service';
import { NextResponse } from 'next/server';
import { PlayerRepository, PlaylistRepository } from '@playsync/database';
import { query } from '@playsync/database';
import { getCurrentUser } from '@/lib/server-auth';
import { logger } from '@/lib/logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const _lc = await requireLicense(); if (_lc) return _lc;
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: playerId } = await params;
    const player = await PlayerRepository.findById(playerId);

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    let playlistId = player.current_playlist_id;

    // If no playlist is directly assigned, try to find one from the company
    if (!playlistId && player.company_id) {
      // Find the first playlist for this company
      const res = await query(
        'SELECT playlist_id FROM company_playlists WHERE company_id = $1 LIMIT 1',
        [player.company_id]
      );
      if (res.rows.length > 0) {
        playlistId = res.rows[0].playlist_id;
      }
    }

    if (!playlistId) {
      // No playlist found for this player
      return NextResponse.json([]);
    }

    const playlist = await PlaylistRepository.findById(playlistId);

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Return the items directly. The player should handle the format.
    // If the player expects a specific format (e.g. nested schedule), we might need to map it here.
    // For now, assuming the player can handle the DB fields or the same format as the frontend store.
    return NextResponse.json(playlist.items || []);

  } catch (error) {
    logger.error({ err: error }, 'Error fetching player content:');
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
