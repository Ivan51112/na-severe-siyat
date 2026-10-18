import { NextResponse } from 'next/server';
import { getAnalyticsSummary } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
  const summary = getAnalyticsSummary();
  return NextResponse.json(summary);
}
