import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?${searchParams.toString()}`,
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000) }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Geocoding API unavailable', fallback: true, results: [] });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Geocoding API unavailable', fallback: true, results: [] });
  }
}
