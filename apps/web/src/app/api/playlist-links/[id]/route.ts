import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import { PlaylistLinkRepository, PlaylistRepository } from '@playsync/database';
import { logger } from '@/lib/logger';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    const { id } = await params;

    const link = await PlaylistLinkRepository.findById(id);
    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const playlist = await PlaylistRepository.findById(link.playlist_id);
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const company = (playlist as any).companies?.[0] || null;

    await PlaylistLinkRepository.updateAccessCount(id);

    // Map DB items (snake_case) to MediaItem interface (camelCase with nested schedule)
    const items = ((playlist as any).items || []).map((item: any) => ({
      id: item.id,
      type: item.type,
      url: item.url,
      name: item.name,
      duration: item.duration,
      rotation: item.rotation,
      layout: item.layout,
      zones: typeof item.zones === 'string' ? JSON.parse(item.zones) : item.zones,
      layoutTemplateId: item.layout_template_id || item.layoutTemplateId,
      regionConfig:
        typeof item.region_config === 'string'
          ? JSON.parse(item.region_config)
          : item.region_config || item.regionConfig || {},
      schedule: {
        startDate: item.schedule_start_date || item.schedule?.startDate || null,
        endDate: item.schedule_end_date || item.schedule?.endDate || null,
        startTime: item.schedule_start_time || item.schedule?.startTime || null,
        endTime: item.schedule_end_time || item.schedule?.endTime || null,
        daysOfWeek:
          typeof item.schedule_days === 'string'
            ? JSON.parse(item.schedule_days)
            : item.schedule_days || item.schedule?.daysOfWeek || [],
        allDay: item.schedule_all_day ?? item.schedule?.allDay ?? true,
        enabled: item.schedule_enabled ?? item.schedule?.enabled ?? true,
      },
    }));

    return NextResponse.json({
      id: link.id,
      companyName: company?.name || '',
      companyId: company?.id || '',
      companyColor: company?.color || null,
      playlistName: playlist.name,
      playlistId: playlist.id,
      updatedAt: playlist.updated_at,
      items,
      theme: link.theme || 'light',
      primaryColor: link.primary_color,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching playlist link:');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
