import { NextRequest, NextResponse } from 'next/server';
import { recordEvent, AnalyticsEventType, resolveGeo } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, city, language, signal, referrer, utmSource, utmMedium, utmCampaign } = body;

    const allowed: AnalyticsEventType[] = [
      'page_view', 'city_change', 'telegram_click', 'forecast_view',
      'sighting_yes', 'sighting_no', 'photo_click', 'mario_hit',
      'game_start', 'city_complete', 'quest_complete'
    ];
    if (!allowed.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 });
    }

    const xForwardedFor = req.headers.get('x-forwarded-for');
    const xRealIp = req.headers.get('x-real-ip');
    const clientIp = (xRealIp || xForwardedFor?.split(',')[0] || '').trim();

    const userAgent = req.headers.get('user-agent') || '';
    const isMobile = /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : 'desktop';

    let visitorCity: string | undefined;
    let visitorCountry: string | undefined;

    if (clientIp) {
      const geo = await resolveGeo(clientIp);
      if (geo) {
        visitorCity = geo.city;
        visitorCountry = geo.country;
      }
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
      ip: clientIp ? clientIp.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.$2.$3.xxx') : undefined,
      visitorCity,
      visitorCountry,
      deviceType,
    });

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}
