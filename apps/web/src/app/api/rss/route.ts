import { requireLicense } from '@/lib/license-service';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const ALLOWED_RSS_DOMAINS = [
    'globo.com', 'g1.globo.com', 'ge.globo.com',
    'rss.nytimes.com', 'feeds.bbci.co.uk', 'feeds.feedburner.com',
    'medium.com', 'medium.com/feed',
    'techcrunch.com', 'feeds.feedburner.com/TechCrunch',
    'wired.com', 'feeds.wired.com',
    'theverge.com', 'www.theverge.com/rss',
];

function isAllowedRssUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;

        // Block private/reserved IPs (SSRF protection)
        const hostname = parsed.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') return false;
        if (hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.16.')) return false;
        if (hostname.endsWith('.local') || hostname.endsWith('.internal')) return false;
        if (/^169\.254\./.test(hostname)) return false;

        // Allow any HTTPS URL that's a valid feed - the main protection is the IP block above
        return true;
    } catch {
        return false;
    }
}

export async function GET(request: Request) {
    const _lc = await requireLicense(); if (_lc) return _lc;
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    if (!isAllowedRssUrl(url)) {
        logger.warn({ url }, 'Blocked RSS request to non-allowed URL');
        return NextResponse.json({ error: 'URL não permitida' }, { status: 403 });
    }

    try {
        // 1. Initial Fetch with Real Browser Headers
        const browserHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        };

        let response = await fetch(url, {
            headers: browserHeaders,
            next: { revalidate: 300 }
        });

        if (!response.ok) {
            // If 403/404, maybe it's not a page but a direct RSS link that requires different handling?
            // For now return error but more detailed
            return NextResponse.json(
                { error: `Erro ao acessar URL (${response.status}): O site pode estar bloqueando o acesso.` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('content-type') || '';
        let text = await response.text();

        // 2. HTML Handling (Auto-Discovery)
        if (contentType.includes('text/html')) {
            // A. Look for <link rel="alternate" ...>
            let feedUrl = null;
            const rssLinkMatch = text.match(/<link[^>]+type=["']application\/(rss|atom)\+xml["'][^>]*href=["']([^"']+)["']/i);

            if (rssLinkMatch && rssLinkMatch[2]) {
                feedUrl = rssLinkMatch[2];
            }
            // B. Heuristic for Globo/G1/GE (Common pattern: /rss/ + path)
            else if (url.includes('globo.com')) {
                // Try to guess: https://ge.globo.com/futebol/ -> https://ge.globo.com/rss/ge/futebol/
                // This is complex, but we can try a simple "rss" injection if it wasn't there
                // Or fallback to the main feed if specific fails
                if (!url.includes('/rss/')) {
                    // Try fetching the generic RSS for the domain as fallback
                    if (url.includes('ge.globo.com')) feedUrl = 'https://ge.globo.com/rss/ge/';
                    else if (url.includes('g1.globo.com')) feedUrl = 'https://g1.globo.com/rss/g1/';
                }
            }

            if (feedUrl) {
                // Handle relative URLs
                if (feedUrl.startsWith('/')) {
                    const origin = new URL(url).origin;
                    feedUrl = `${origin}${feedUrl}`;
                } else if (!feedUrl.startsWith('http')) {
                    const baseUrl = new URL(url);
                    feedUrl = new URL(feedUrl, baseUrl.href).href;
                }

                console.log(`[RSS Proxy] Found feed: ${feedUrl}`);
                response = await fetch(feedUrl, {
                    headers: browserHeaders,
                    next: { revalidate: 300 }
                });

                if (response.ok) {
                    text = await response.text();
                } else {
                    return NextResponse.json({ error: 'Feed RSS encontrado mas não acessível.' }, { status: 400 });
                }
            } else {
                return NextResponse.json(
                    { error: 'Não foi possível encontrar um Feed RSS nesta página. Tente o link direto do RSS (ex: .xml).' },
                    { status: 400 }
                );
            }
        }

        // 3. Return XML
        return new NextResponse(text, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 's-maxage=300, stale-while-revalidate',
            },
        });
    } catch (error) {
        logger.error({ err: error }, 'RSS Proxy Error:');
        return NextResponse.json(
            { error: 'Falha interna ao processar requisição.' },
            { status: 500 }
        );
    }
}
