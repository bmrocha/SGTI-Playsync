import { query } from '../db/index';

export interface MediaItem {
    id: string;
    playlist_id: string;
    type: string;
    url: string;
    name: string;
    duration: number;
    rotation: number;
    layout?: string;
    layout_template_id?: string;
    region_config?: any;
    zones?: any;
    schedule_start_date?: Date;
    schedule_end_date?: Date;
    schedule_start_time?: string;
    schedule_end_time?: string;
    schedule_days?: any;
    schedule_all_day: boolean;
    schedule_enabled: boolean;
    order: number;
    created_at: Date;
    updated_at: Date;
}

export class MediaItemRepository {
    static async findByPlaylistId(playlistId: string): Promise<MediaItem[]> {
        const res = await query(
            'SELECT * FROM media_items WHERE playlist_id = $1 ORDER BY "order" ASC',
            [playlistId]
        );
        return res.rows;
    }

    static async deleteByPlaylistId(playlistId: string): Promise<void> {
        await query('DELETE FROM media_items WHERE playlist_id = $1', [playlistId]);
    }

    static async create(data: Omit<MediaItem, 'id' | 'created_at' | 'updated_at'>): Promise<MediaItem> {
        const {
            playlist_id, type, url, name, duration, rotation, layout,
            schedule_start_date, schedule_end_date, schedule_start_time, schedule_end_time,
            schedule_days, schedule_all_day, schedule_enabled, order,
            layout_template_id, region_config, zones
        } = data;

        const res = await query(
            `INSERT INTO media_items (
                playlist_id, type, url, name, duration, rotation, layout,
                schedule_start_date, schedule_end_date, schedule_start_time, schedule_end_time,
                schedule_days, schedule_all_day, schedule_enabled, "order",
                layout_template_id, region_config, zones
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING *`,
            [
                playlist_id, type, url, name, duration, rotation, layout,
                schedule_start_date, schedule_end_date, schedule_start_time, schedule_end_time,
                schedule_days, schedule_all_day, schedule_enabled, order,
                layout_template_id || null, region_config ? JSON.stringify(region_config) : null,
                zones ? JSON.stringify(zones) : null
            ]
        );
        return res.rows[0];
    }
}
