export type AnalyticsEventType =
  | 'page_view' | 'city_change' | 'telegram_click' | 'forecast_view'
  | 'sighting_yes' | 'sighting_no' | 'photo_click' | 'mario_hit'
  | 'game_start' | 'city_complete' | 'quest_complete';

export interface AnalyticsEvent {
  id: string;
  timestamp: string;
  eventType: AnalyticsEventType;
  city?: string;
  language?: string;
  signal?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  ip?: string;
  visitorCity?: string;
  visitorCountry?: string;
  deviceType?: 'mobile' | 'desktop';
}

import fs from 'fs';
import path from 'path';
import http from 'http';

// In-memory buffer + persistent JSONL append log
const eventStore: AnalyticsEvent[] = [];
const MAX_EVENTS = 2000;
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'analytics.jsonl');
const GEO_CACHE_FILE = path.join(DATA_DIR, 'geo_cache.json');

const geoCache: Record<string, { city: string; country: string }> = {};

// Load geo cache from disk
try {
  if (typeof window === 'undefined') {
    if (fs.existsSync(GEO_CACHE_FILE)) {
      const data = fs.readFileSync(GEO_CACHE_FILE, 'utf-8');
      Object.assign(geoCache, JSON.parse(data));
    }
  }
} catch {}

function saveGeoCache() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(GEO_CACHE_FILE, JSON.stringify(geoCache, null, 2), 'utf-8');
  } catch {}
}

export function resolveGeo(ip: string): Promise<{ city: string; country: string } | null> {
  return new Promise((resolve) => {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('10.') || ip.startsWith('192.168.')) {
      return resolve(null);
    }

    if (geoCache[ip]) {
      return resolve(geoCache[ip]);
    }

    const req = http.get(`http://ip-api.com/json/${ip}?lang=ru`, { timeout: 1500 }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data && data.status === 'success' && data.city) {
            const entry = { city: data.city, country: data.country || 'Россия' };
            geoCache[ip] = entry;
            saveGeoCache();
            return resolve(entry);
          }
        } catch {}
        resolve(null);
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

// Initialize and restore recent events on startup
try {
  if (typeof window === 'undefined') {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      for (const line of lines.slice(-MAX_EVENTS)) {
        try {
          eventStore.push(JSON.parse(line));
        } catch {}
      }
    }
  }
} catch {}

export function recordEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): AnalyticsEvent {
  const newEvent: AnalyticsEvent = {
    ...event,
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  eventStore.push(newEvent);
  if (eventStore.length > MAX_EVENTS) {
    eventStore.shift();
  }

  // Persist to disk asynchronously
  if (typeof window === 'undefined') {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.appendFileSync(DATA_FILE, JSON.stringify(newEvent) + '\n', 'utf-8');
    } catch {}
  }

  return newEvent;
}

export function getAnalyticsSummary() {
  const totalEvents = eventStore.length;
  const pageViews = eventStore.filter((e) => e.eventType === 'page_view').length;
  const telegramClicks = eventStore.filter((e) => e.eventType === 'telegram_click').length;
  const cityChanges = eventStore.filter((e) => e.eventType === 'city_change').length;
  const forecastViews = eventStore.filter((e) => e.eventType === 'forecast_view').length;
  const sightingsYes = eventStore.filter((e) => e.eventType === 'sighting_yes').length;
  const sightingsNo = eventStore.filter((e) => e.eventType === 'sighting_no').length;
  const photoClicks = eventStore.filter((e) => e.eventType === 'photo_click').length;
  const gameStarts = eventStore.filter((e) => e.eventType === 'game_start').length;
  const cityCompletes = eventStore.filter((e) => e.eventType === 'city_complete').length;
  const questCompletes = eventStore.filter((e) => e.eventType === 'quest_complete').length;

  const clicksByCity: Record<string, number> = {};
  const clicksBySource: Record<string, number> = {};

  for (const e of eventStore) {
    if (e.eventType === 'telegram_click') {
      const city = e.city || 'unknown';
      clicksByCity[city] = (clicksByCity[city] || 0) + 1;

      const source = e.utmSource || (e.referrer ? new URL(e.referrer, 'http://localhost').hostname : 'direct');
      clicksBySource[source] = (clicksBySource[source] || 0) + 1;
    }
  }

  const conversionRate = pageViews > 0 ? ((telegramClicks / pageViews) * 100).toFixed(1) + '%' : '0%';

  return {
    totalEvents,
    pageViews,
    telegramClicks,
    cityChanges,
    forecastViews,
    sightingsYes,
    sightingsNo,
    photoClicks,
    gameStarts,
    cityCompletes,
    questCompletes,
    conversionRate,
    clicksByCity,
    clicksBySource,
    recentEvents: eventStore.slice(-20).reverse(),
  };
}
