import type { Metadata, Viewport } from 'next';
import './globals.css';
import './aurora.css';
import './redesign.css';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aurora-polaris.ru';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#07131c',
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'Северное сияние в Мурманске, Териберке и Кировске — Прогноз неба онлайн',
  description:
    'Где сегодня видно северное сияние: оперативная оценка облачности и вероятности над Мурманском, Териберкой и Кировском. Спутниковые данные и модель NOAA SWPC.',
  keywords: [
    'северное сияние мурманск',
    'северное сияние сегодня',
    'прогноз северного сияния',
    'северное сияние териберка',
    'северное сияние кировск',
    'облачность мурманск',
    'охота за северным сиянием',
    'полярное сияние кольский полуостров',
    'видимость сияния сейчас',
  ],
  authors: [{ name: 'На Севере — сиять' }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    title: 'Северное сияние в Мурманске, Териберке и Кировске — Прогноз неба онлайн',
    description:
      'Где сегодня видно северное сияние: оперативная оценка облачности и вероятности над Мурманском, Териберкой и Кировском. Спутник и геофизика в реальном времени.',
    siteName: 'На Севере — сиять',
    locale: 'ru_RU',
    images: [
      {
        url: '/images/hero-teriberka-aurora.png',
        width: 1672,
        height: 941,
        alt: 'Северное сияние над Кольским полуостровом',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Северное сияние в Мурманске, Териберке и Кировске — Прогноз неба онлайн',
    description:
      'Оперативная оценка облачности и вероятности полярного сияния в Мурманске, Териберке и Кировске.',
    images: ['/images/hero-teriberka-aurora.png'],
  },
};

// Structured Data for Google & Yandex Rich Snippets (FAQPage & WebApplication)
const schemaFaq = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Где лучше всего наблюдать северное сияние в Мурманской области?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Лучшие локации для наблюдения — побережье Териберки (открытый северный горизонт над Баренцевым морем без городской засветки), горный массив Хибин в районе Кировска и загородные сопки в 15-20 км от Мурманска.',
      },
    },
    {
      '@type': 'Question',
      name: 'В какое время суток чаще всего появляется полярное сияние?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Пик геомагнитной активности на Кольском полуострове обычно приходится на отрезок с 21:00 до 02:00 по московскому времени при условии тёмного неба и отсутствия сплошной облачности.',
      },
    },
    {
      '@type': 'Question',
      name: 'Какая облачность допустима для наблюдения сияния?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Благоприятные условия возникают при общей облачности ниже 25%. При облачности от 25% до 65% возможны разрывы и просветы, через которые можно увидеть сияние. При облачности свыше 80% наблюдение с земли маловероятно.',
      },
    },
    {
      '@type': 'Question',
      name: 'Что означают параметры солнечного ветра (скорость и Bz)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Для яркого сияния желательна скорость солнечного ветра выше 400-450 км/с и отрицательное значение межпланетного магнитного поля Bz (южное направление, Bz < 0), что позволяет частицам солнечного ветра проникать в магнитосферу Земли.',
      },
    },
  ],
};

const schemaApp = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'На Севере — сиять (Аврора Мурманск)',
  url: 'https://aurora-polaris.ru',
  applicationCategory: 'WeatherApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'RUB',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFaq) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaApp) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
