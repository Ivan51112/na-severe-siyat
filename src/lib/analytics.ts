export type AnalyticsEventType =
  | 'page_view' | 'city_change' | 'telegram_click' | 'forecast_view'
  | 'sighting_yes' | 'sighting_no' | 'photo_click' | 'mario_hit';

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
}

// In-memory buffer for development & serverless demonstration
// In production, this can seamlessly write to SQLite/PostgreSQL/ClickHouse
const eventStore: AnalyticsEvent[] = [];
const MAX_EVENTS = 1000;

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
    conversionRate,
    clicksByCity,
    clicksBySource,
    recentEvents: eventStore.slice(-20).reverse(),
  };
}
