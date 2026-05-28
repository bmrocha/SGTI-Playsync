export function formatLicenseDuration(expiresAt: string): string {
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  const diff = exp - now;
  if (diff <= 0) return 'Expirada';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 365) {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    return `${years} ano(s) e ${remainingDays} dia(s)`;
  }
  return `${days} dia(s)`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === '1970-01-01T00:00:00.000Z') return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
