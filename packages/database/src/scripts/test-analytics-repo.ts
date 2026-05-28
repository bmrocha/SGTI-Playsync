import 'dotenv/config';
import { AnalyticsRepository } from '../lib/repositories/analytics.repository';
import { CompanyRepository } from '../lib/repositories/company.repository';
import { PlaylistRepository } from '../lib/repositories/playlist.repository';
import { PlayerRepository } from '../lib/repositories/player.repository';
import { MediaItemRepository } from '../lib/repositories/media-item.repository';
import { generateUUID } from '../lib/utils';
import pool from '../lib/db';

async function runTests() {
    console.log('🧪 Starting Analytics Repository Regression Tests...');

    // Setup Test Data
    const testCompany = await CompanyRepository.create({
        name: `Test Company ${generateUUID()}`,
        description: 'Regression Test Company',
        color: '#000000'
    });
    console.log('✅ Created Test Company:', testCompany.id);

    // Create a playlist
    const testPlaylist = await PlaylistRepository.create({
        name: `Test Playlist ${generateUUID()}`,
        companyIds: [testCompany.id]
    });
    console.log('✅ Created Test Playlist:', testPlaylist.id);

    // Create a player (optional now)
    const testPlayer = await PlayerRepository.create({
        id: generateUUID(),
        name: `Test Player ${generateUUID()}`,
        company_id: testCompany.id,
        token: generateUUID()
    });
    console.log('✅ Created Test Player:', testPlayer.id);

    try {
        // Test 1: Create Log WITH Player ID
        console.log('\nTesting create log with player_id...');
        const logWithPlayer = await AnalyticsRepository.create({
            player_id: testPlayer.id,
            company_id: testCompany.id,
            playlist_id: testPlaylist.id,
            played_at: new Date(),
            duration_played: 10,
            media_item_id: undefined // Optional
        });
        if (logWithPlayer.player_id !== testPlayer.id) throw new Error('Player ID mismatch');
        console.log('✅ Log created successfully with player_id');

        // Test 2: Create Log WITHOUT Player ID (Web Player)
        console.log('\nTesting create log without player_id (Web Player)...');
        const logWithoutPlayer = await AnalyticsRepository.create({
            player_id: null,
            company_id: testCompany.id,
            playlist_id: testPlaylist.id,
            played_at: new Date(),
            duration_played: 15,
            media_item_id: undefined
        });
        if (logWithoutPlayer.player_id !== null) throw new Error('Player ID should be null');
        console.log('✅ Log created successfully without player_id');

        // Test 3: Batch Insert Mixed
        console.log('\nTesting batch insert...');
        await AnalyticsRepository.createMany([
            {
                player_id: testPlayer.id,
                company_id: testCompany.id,
                playlist_id: testPlaylist.id,
                played_at: new Date(),
                duration_played: 5
            },
            {
                player_id: null,
                company_id: testCompany.id,
                playlist_id: testPlaylist.id,
                played_at: new Date(),
                duration_played: 8
            }
        ]);
        console.log('✅ Batch insert successful');

        // Test 4: Retrieve Logs with Filters
        console.log('\nTesting getLogs filter...');
        const logs = await AnalyticsRepository.getLogs({
            companyId: testCompany.id
        });
        
        console.log(`Found ${logs.length} logs for test company.`);
        if (logs.length < 4) throw new Error(`Expected at least 4 logs, found ${logs.length}`);
        
        // Check filtering by player
        const playerLogs = await AnalyticsRepository.getLogs({
            companyId: testCompany.id,
            playerId: testPlayer.id
        });
        console.log(`Found ${playerLogs.length} logs for specific player.`);
        // Should be at least 2 (1 single + 1 from batch)
        if (playerLogs.length < 2) throw new Error(`Expected at least 2 logs for player, found ${playerLogs.length}`);

        console.log('\n✅ All Tests Passed Successfully!');

    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    } finally {
        // Cleanup
        console.log('\nCleaning up...');
        await CompanyRepository.delete(testCompany.id); // Cascades to playlists and players usually, but let's be safe
        await pool.end();
    }
}

runTests();
