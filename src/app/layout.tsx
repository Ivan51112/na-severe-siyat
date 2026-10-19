import type { Metadata, Viewport } from 'next';
import './globals.css';
import './aurora.css';
import './redesign.css';
import './mario-arcade.css';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://na-severe-siyat.ru';

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
      name: 'Где сегодня видно северное сияние в Мурманской области?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Главные точки наблюдения: Серебрянское шоссе за пределами засветки Мурманска (км 25–49), открытый морской горизонт Териберки и горный массив Хибин в районе Кировска. Актуальная облачность отслеживается онлайн на радаре na-severe-siyat.ru.',
      },
    },
    {
      '@type': 'Question',
      name: 'Во сколько часов ночи чаще всего появляется полярное сияние?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Пик геомагнитной активности на Кольском полуострове наступает с 21:00 до 01:30 по московскому времени при условии темного неба и отсутствия сплошной низкой облачности.',
      },
    },
    {
      '@type': 'Question',
      name: 'Что надежнее: бесплатные графики, платные камеры AuroraCam или гиды?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Для самостоятельных путешественников на автомобиле оптимальна связка онлайн-радара облачности, отслеживания отрицательного параметра Bz и сверки с ночными all-sky камерами AuroraCam. Платные гиды рекомендуются тем, кто без машины и впервые в зимней тундре.',
      },
    },
    {
      '@type': 'Question',
      name: 'Какая облачность допустима для наблюдения сияния?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Идеальные условия — общая облачность до 25%. При облачности 25–65% возможны разрывы туч и окна ясного неба. При облачности свыше 80% сияние с земли не видно.',
      },
    },
    {
      '@type': 'Question',
      name: 'Что означает параметр Bz солнечного ветра?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Для яркого сияния критически важен отрицательный Bz (южное направление, со знаком минус). При Bz < 0 магнитные линии солнечного ветра смыкаются с полем Земли и плазма проникает в верхние слои атмосферы.',
      },
    },
    {
      '@type': 'Question',
      name: 'Как сфотографировать северное сияние на обычный смартфон?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Включите Ночной режим (Night Mode), установите выдержку 3–10 секунд, зафиксируйте телефон неподвижно на упоре или штативе и обязательно отключите вспышку.',
      },
    },
  ],
};

const schemaApp = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'На Севере — сиять (Хаб охотника за сиянием)',
  url: baseUrl,
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
