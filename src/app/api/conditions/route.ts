import { NextResponse } from 'next/server';
import { getLiveConditions, LiveConditions } from '@/lib/conditions';

export const dynamic = 'force-dynamic';

// In-memory cache to protect external APIs (Open-Meteo, NOAA) from rate limits
let cachedData: LiveConditions | null = null;
let lastFetchTime = 0;
let pendingFetch: Promise<LiveConditions> | null = null;

const CACHE_TTL_MS = 60_000; // 60 seconds freshness

async function getCachedLiveConditions(): Promise<LiveConditions> {
  const now = Date.now();

  // Return fresh cache if within TTL
  if (cachedData && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedData;
  }

  // Deduplicate in-flight requests
  if (pendingFetch) {
    return pendingFetch;
  }

  pendingFetch = getLiveConditions()
    .then((fresh) => {
      cachedData = fresh;
      lastFetchTime = Date.now();
      return fresh;
    })
    .catch((err) => {
      // If fresh fetch fails but we have stale cache, gracefully return stale
      if (cachedData) {
        console.warn('Live fetch failed, serving stale cache:', err);
        return cachedData;
      }
      throw err;
    })
    .finally(() => {
      pendingFetch = null;
    });

  return pendingFetch;
}

export async function GET() {
  try {
    const data = await getCachedLiveConditions();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Failed to fetch conditions:', error);
    return NextResponse.json(
      { error: 'Источники данных временно недоступны' },
      { status: 503 }
    );
  }
}
