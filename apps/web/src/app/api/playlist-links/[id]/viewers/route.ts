import { NextRequest, NextResponse } from 'next/server';
import { PlaylistLinkRepository, PlaylistLinkViewerRepository } from '@playsync/database';
import { logger } from '@/lib/logger';

// POST: Register heartbeat from active viewer
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Verify the playlist link exists
    const link = await PlaylistLinkRepository.findById(id);
    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const body = await request.json();
    const viewerId = body.viewerId;

    if (!viewerId) {
      return NextResponse.json({ error: 'Missing viewerId' }, { status: 400 });
    }

    // Get client information
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress =
      forwardedFor?.split(',')[0].trim() || request.headers.get('x-real-ip') || undefined;

    // Register heartbeat
    console.log('[Viewer Tracking API] Registering heartbeat:', {
      playlistLinkId: id,
      viewerId,
      userAgent,
      ipAddress,
    });
    await PlaylistLinkViewerRepository.upsertHeartbeat(id, viewerId, userAgent, ipAddress);

    // Get current active viewer count
    const activeCount = await PlaylistLinkViewerRepository.getActiveViewerCount(id);
    console.log('[Viewer Tracking API] Active viewer count:', activeCount);

    return NextResponse.json({
      success: true,
      activeViewers: activeCount,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error processing viewer heartbeat:');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove viewer when they close the player
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const viewerId = url.searchParams.get('viewerId');

    if (!viewerId) {
      return NextResponse.json({ error: 'Missing viewerId' }, { status: 400 });
    }

    await PlaylistLinkViewerRepository.removeViewer(id, viewerId);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Error removing viewer:');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Get current active viewer count
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Verify the playlist link exists
    const link = await PlaylistLinkRepository.findById(id);
    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const activeCount = await PlaylistLinkViewerRepository.getActiveViewerCount(id);

    return NextResponse.json({
      activeViewers: activeCount,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching viewer count:');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
