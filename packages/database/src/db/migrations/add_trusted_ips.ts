
import { query } from '../index';

export async function up() {
    await query(`
        INSERT INTO system_settings (key, value) 
        VALUES ('trusted_ips', '"127.0.0.1"') 
        ON CONFLICT (key) DO NOTHING;
    `);
    console.log('Ensured trusted_ips key exists in system_settings');
}

export async function down() {
    await query(`
        DELETE FROM system_settings WHERE key = 'trusted_ips';
    `);
    console.log('Removed trusted_ips key from system_settings');
}
