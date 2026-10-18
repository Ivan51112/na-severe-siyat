import { NextRequest, NextResponse } from 'next/server';
import { recordEvent, AnalyticsEventType } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, city, language, signal, referrer, utmSource, utmMedium, utmCampaign } = body;

    const allowed: AnalyticsEventType[] = ['page_view', 'city_change', 'telegram_click', 'forecast_view', 'sighting_yes', 'sighting_no', 'photo_click'];
    if (!allowed.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 });
    }

    const event = recordEvent({
      eventType: eventType as AnalyticsEventType,
      city,
      language,
      signal,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
    });

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}
