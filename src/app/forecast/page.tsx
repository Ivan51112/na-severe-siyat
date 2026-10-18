import { redirect } from 'next/navigation';

// Old links to the demo forecast now lead to the current, focused landing page.
export default function ForecastPage({ searchParams }: { searchParams: { city?: string; lang?: string } }) {
  const params = new URLSearchParams();
  if (searchParams.city === 'murmansk' || searchParams.city === 'teriberka' || searchParams.city === 'kirovsk') {
    params.set('city', searchParams.city);
  }
  if (searchParams.lang === 'zh') params.set('lang', 'zh');
  redirect('/' + (params.size ? '?' + params.toString() : ''));
}
