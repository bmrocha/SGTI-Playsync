import { query } from '../db/index';

export class CompanyPlaylistRepository {
    static async link(companyId: string, playlistId: string): Promise<void> {
        await query(
            'INSERT INTO company_playlists (company_id, playlist_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [companyId, playlistId]
        );
    }

    static async unlink(companyId: string, playlistId: string): Promise<void> {
        await query(
            'DELETE FROM company_playlists WHERE company_id = $1 AND playlist_id = $2',
            [companyId, playlistId]
        );
    }
}
