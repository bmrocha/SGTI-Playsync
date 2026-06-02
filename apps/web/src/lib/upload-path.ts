import fs from 'fs';
import path from 'path';

/**
 * Resolve o diretório de uploads de forma determinística,
 * priorizando o diretório público correto independente de process.cwd().
 */
export function resolveUploadDir(): string {
  // Ambiente Docker/standalone: /app/public/uploads (mapeado via volume)
  const dockerLikeDir = path.join(process.cwd(), 'public', 'uploads');

  // Desenvolvimento no monorepo: apps/web/public/uploads
  const monorepoDir = path.join(process.cwd(), 'apps', 'web', 'public', 'uploads');

  // Se estivermos rodando de dentro de apps/web (cwd = apps/web)
  const appDir = path.join(process.cwd(), 'public', 'uploads');

  // Ordem de prioridade: appDir (quando cwd é apps/web) → monorepoDir → dockerLikeDir
  if (fs.existsSync(appDir)) {
    return appDir;
  }
  if (fs.existsSync(path.dirname(monorepoDir))) {
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
