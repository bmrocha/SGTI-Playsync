/**
 * Client-safe license utilities that can be imported in 'use client' components.
 *
 * IMPORTANT: This file must NEVER import:
 * - @playsync/database
 * - Node.js built-in modules (fs, crypto, path, etc.)
 * - Any server-only code
 *
 * For server-side license operations, use license-service.ts instead.
 */

// Get persisted temporary installation ID from localStorage (client-side only)
export function getTemporaryInstallationId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('temporary_installation_id');
  } catch {
    return null;
  }
}

// Set persisted temporary installation ID to localStorage (client-side only)
export function setTemporaryInstallationId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('temporary_installation_id', id);
  } catch {
    // localStorage not available
  }
}

// Clear persisted temporary installation ID from localStorage
export function clearTemporaryInstallationId(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('temporary_installation_id');
  } catch {
    // localStorage not available
  }
}

// Generate a fresh random installation ID (uses Web Crypto API, safe for browser)
export function generateInstallationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
