import fs from 'fs';
import path from 'path';

/**
 * Resolve o diretório de uploads de forma determinística,
 * priorizando o diretório público correto independente de process.cwd().
 */
export function resolveUploadDir(): string {
  // Use __dirname to get the actual location of this file (apps/web/src/lib/upload-path.ts)
  // Then navigate up to apps/web root
  const libDir = path.resolve(__dirname); // apps/web/src/lib (or .next/server/chunks for compiled)
  const srcDir = path.dirname(libDir); // apps/web/src
  const webRootDir = path.dirname(srcDir); // apps/web
  const webPublicDir = path.join(webRootDir, 'public', 'uploads');

  // Desenvolvimento no monorepo: apps/web/public/uploads
  const monorepoDir = path.join(process.cwd(), 'apps', 'web', 'public', 'uploads');

  // Ambiente Docker/standalone: /app/public/uploads (mapeado via volume)
  const dockerLikeDir = path.join(process.cwd(), 'public', 'uploads');

  // Se estivermos rodando de dentro de apps/web (cwd = apps/web)
  const appDir = path.join(process.cwd(), 'public', 'uploads');

  // Ordem de prioridade: webPublicDir (baseado em __dirname) → appDir → monorepoDir → dockerLikeDir
  if (fs.existsSync(webPublicDir)) {
    return webPublicDir;
  }
  if (fs.existsSync(appDir)) {
    return appDir;
  }
  if (fs.existsSync(monorepoDir)) {
    return monorepoDir;
  }
  return dockerLikeDir;
}

/**
 * Garante que o diretório de uploads exista.
 */
export function ensureUploadDir(): string {
  const dir = resolveUploadDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}
