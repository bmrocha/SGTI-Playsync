import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import {
  CompanyRepository,
  PlaylistRepository,
  CompanyPlaylistRepository,
  MediaItemRepository,
  PlaylistLinkRepository,
} from '@playsync/database';
import { getCurrentUser } from '@/lib/server-auth';
import { UserRole } from '@/lib/permissions';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';

function generateShortId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// POST /api/playlist-links - Create new playlist link
export async function POST(request: NextRequest) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hasPermission, Permission } = await import('@/lib/permissions');
    if (
      !hasPermission(
        currentUser.role as UserRole,
        Permission.EDIT_PLAYLIST,
        currentUser.permissions,
      )
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { companyName, playlistName, items, playlistId, companyId, theme, primaryColor } = body;

    if (playlistId) {
      const playlist = await PlaylistRepository.findById(playlistId);
      if (!playlist) {
        return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
      }

      let resolvedCompanyId: string | null = companyId || null;
      if (
        !resolvedCompanyId &&
        Array.isArray((playlist as any).companies) &&
        (playlist as any).companies.length > 0
      ) {
        resolvedCompanyId = (playlist as any).companies[0]?.id || null;
      }

      let company = resolvedCompanyId ? await CompanyRepository.findById(resolvedCompanyId) : null;
      if (!company) {
        if (!companyName) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        company = await CompanyRepository.findByName(companyName);
        if (!company) {
          company = await CompanyRepository.create({ name: companyName });
        }
        resolvedCompanyId = company.id;
      }

      await CompanyPlaylistRepository.link(resolvedCompanyId as string, playlist.id);

      let link = await PlaylistLinkRepository.findByPlaylistId(playlist.id);
      if (link) {
        // Persistent ID found for this playlist! Update theme and/or color if changed
        console.log(
          `[API] Found existing link ${link.id} for playlist ${playlist.id}. Updating theme=${theme}, color=${primaryColor}`,
        );
        if (theme !== undefined || primaryColor !== undefined) {
          await PlaylistLinkRepository.updateThemeAndColor(
            link.id,
            theme || link.theme,
            primaryColor !== undefined ? primaryColor : link.primary_color,
          );
        }
      } else {
        let id = generateShortId();
        let retries = 0;
        while ((await PlaylistLinkRepository.findById(id)) && retries < 5) {
          id = generateShortId();
          retries++;
        }
        if (retries >= 5) {
          throw new Error('Failed to generate unique link ID');
        }
        link = await PlaylistLinkRepository.create(
          id,
          resolvedCompanyId as string,
          playlist.id,
          theme || 'light',
          primaryColor,
        );
      }

      return NextResponse.json({ id: link.id });
    }

    // Find or Create Company branch
    if (!companyName || !playlistName || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Find or Create Company
    let company = await CompanyRepository.findByName(companyName);
    if (!company) {
      company = await CompanyRepository.create({ name: companyName });
    }

    // 2. Find or Create Playlist
    let playlist = await PlaylistRepository.findByName(playlistName);
    if (!playlist) {
      playlist = await PlaylistRepository.create({ name: playlistName });
    }

    // 3. Link Company and Playlist
    await CompanyPlaylistRepository.link(company.id, playlist.id);

    // 4. Update Media Items
    // Delete existing items for this playlist to replace with new ones
    await MediaItemRepository.deleteByPlaylistId(playlist.id);

    // Filter out items whose URL doesn't exist in media_library (only for image/video types)
    const validItems = await PlaylistRepository.filterValidItems(items);

    // Insert new items
    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      const schedule = item.schedule || {};

      await MediaItemRepository.create({
        playlist_id: playlist.id,
        type: item.type || 'image',
        url: item.url || '',
        name: item.name || 'Untitled',
        duration: item.duration || 10,
        rotation: item.rotation || 0,
        layout: item.layout || 'single',
        zones: item.zones,
        layout_template_id: item.layoutTemplateId,
        region_config: item.regionConfig,
        schedule_start_date: schedule.startDate ? new Date(schedule.startDate) : undefined,
        schedule_end_date: schedule.endDate ? new Date(schedule.endDate) : undefined,
        schedule_start_time: schedule.startTime,
        schedule_end_time: schedule.endTime,
        schedule_days: JSON.stringify(schedule.daysOfWeek || []),
        schedule_all_day: schedule.allDay !== undefined ? schedule.allDay : true,
        schedule_enabled: schedule.enabled !== undefined ? schedule.enabled : true,
        order: i,
      });
    }

    // 5. Create or Update Link (Absolute Playlist ID persistence)
    let link = await PlaylistLinkRepository.findByPlaylistId(playlist.id);

    if (link) {
      // Update theme and color if provided
      if (theme !== undefined || primaryColor !== undefined) {
        await PlaylistLinkRepository.updateThemeAndColor(
          link.id,
          theme || link.theme,
          primaryColor !== undefined ? primaryColor : link.primary_color,
        );
      }
    } else {
      // Generate unique ID for NEW link
      let id = generateShortId();
      let retries = 0;
      while ((await PlaylistLinkRepository.findById(id)) && retries < 5) {
        id = generateShortId();
        retries++;
      }

      if (retries >= 5) {
        throw new Error('Failed to generate unique link ID');
      }

      link = await PlaylistLinkRepository.create(
        id,
        company.id,
        playlist.id,
        theme || 'light',
        primaryColor,
      );
    }

    logServerAction({
      userId: currentUser.id,
      userName: currentUser.name || currentUser.email,
      userRole: currentUser.role,
      action: 'CREATE',
      resource: 'playlist_link',
      details: `Link para playlist ${playlistName} criado`,
      resourceId: link.id,
      resourceName: playlistName,
    });

    return NextResponse.json({ id: link.id });
  } catch (error) {
    logger.error({ err: error }, 'Error creating playlist link:');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/playlist-links - Get all playlist links (for admin/debugging)
// Note: The original implementation returned all links. We might want to restrict this or implement pagination.
export async function GET() {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (currentUser.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json([]);
}
