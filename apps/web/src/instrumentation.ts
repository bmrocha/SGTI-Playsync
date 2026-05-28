export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { query, runMigrations } = await import('@playsync/database');

      await runMigrations();

      const adminCheck = await query(
        "SELECT EXISTS (SELECT FROM users WHERE email = 'admin@sgti.tec.br')"
      );

      if (!adminCheck.rows[0]?.exists) {
        const { seed } = await import('@playsync/database/seed');
        await seed();
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
}
