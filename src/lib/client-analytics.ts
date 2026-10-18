import type { AnalyticsEventType } from './analytics';

export function sendAnalytics(eventType: AnalyticsEventType, city?: string, language?: string, signal?: string) {
  try {
    const params = new URLSearchParams(window.location.search);
    const payload = JSON.stringify({
      eventType, city, language, signal,
      referrer: document.referrer || undefined,
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
    });
    if (navigator.sendBeacon?.('/api/analytics', new Blob([payload], { type: 'application/json' }))) return;
    void fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
  } catch {
    // Analytics never blocks the visitor's action.
  }
}
