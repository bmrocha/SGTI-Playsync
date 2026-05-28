import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams(searchParams);
  params.set('timezone', 'auto');

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
      { next: { revalidate: 1800 }, signal: AbortSignal.timeout(5000) }
    );

    if (!res.ok) {
      console.warn('[Weather Proxy] Open-Meteo returned', res.status);
      return NextResponse.json({ error: 'Weather API unavailable', fallback: true });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    console.warn('[Weather Proxy] Open-Meteo fetch failed');
    return NextResponse.json({ error: 'Weather API unavailable', fallback: true });
  }
}
