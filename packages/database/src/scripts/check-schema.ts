import { Client } from 'pg';

async function checkSchema() {
    const client = new Client({
        user: 'admin',
        password: 'admin123',
        host: 'localhost',
        port: 5433,
        database: 'sgti_media_player',
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'media_items';
        `);
        console.log('Columns in media_items table:');
        res.rows.forEach(row => {
            console.log(`${row.column_name}: ${row.data_type}`);
        });
    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        await client.end();
    }
}

checkSchema();
