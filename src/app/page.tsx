'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronDown, Compass, MapPin, Send, Sparkles } from 'lucide-react';
import { CITIES, CityConditions, CityId, LiveConditions } from '@/lib/conditions';
import { selectVisualScene } from '@/lib/visual-scene';
import { sendAnalytics } from '@/lib/client-analytics';

type Language = 'ru' | 'zh';
type DemoScene = 'aurora' | 'day' | 'clouds' | 'snow' | null;
const CITY_IDS: CityId[] = ['murmansk', 'teriberka', 'kirovsk'];
const CHANNEL_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL?.trim() || 'https://t.me/na_severe_siyat';
const HAS_CHANNEL = Boolean(CHANNEL_URL && /^https:\/\/(?:t\.me|telegram\.me)\//i.test(CHANNEL_URL));

const copy = {
  ru: {
    brand: 'НА СЕВЕРЕ — СИЯТЬ',
    eyebrow: 'СЕВЕРНОЕ СИЯНИЕ · МУРМАНСКАЯ ОБЛАСТЬ',
    title: 'Что с небом сейчас?',
    current: 'ОБЛАЧНОСТЬ СЕЙЧАС',
    conditions: {
      clear: ['Небо почти ясное', 'По погодной модели облаков мало — отличный сектор для обзора.'],
      patchy: ['Есть облака и просветы', 'Облачность меняется. Ловите разрывы туч в северном секторе.'],
      cloudy: ['Небо закрыто облаками', 'Плотный облачный покров. Следите за спутником в канале.'],
      rain: ['Идёт дождь', 'Осадки и облака мешают наблюдению.'],
      snow: ['Идёт снег', 'Снегопад закрывает обзор неба.'],
      unavailable: ['Нет свежих данных', 'Сейчас не можем оценить облачность в этом месте.'],
    },
    cloud: 'Облачность',
    solar: 'СОЛНЕЧНЫЙ ВЕТЕР · NOAA',
    solarUnavailable: 'Нет свежих данных',
    auroraChance: 'Модель NOAA',
    withoutClouds: 'без учёта облаков',
    updated: 'Данные погоды',
    demo: 'СЦЕНАРИЙ ДИЗАЙНА · НЕ ТЕКУЩАЯ ПОГОДА',
    telegramTitle: 'Telegram-канал',
    telegramButton: 'Подписаться на Telegram-канал',
    telegramSubtitle: 'Спутниковые снимки Кольского и оповещения о просветах',
    telegramPending: 'Подписаться на Telegram-канал',
    telegramSoon: 'Скоро откроется',
    telegramUnavailable: 'Telegram-канал пока не открыт.',
  },
  zh: {
    brand: '极光 / 摩尔曼斯克',
    eyebrow: '北极光 · 摩尔曼斯克州',
    title: '现在的天空怎么样？',
    current: '当前云量',
    conditions: {
      clear: ['天空基本晴朗', '根据天气模型，云量较少。'],
      patchy: ['有云，也有空隙', '云量正在变化，现场天空可能不同。'],
      cloudy: ['天空被云层覆盖', ''],
      rain: ['正在下雨', '降水和云层妨碍观察。'],
      snow: ['正在下雪', '雪和云层遮挡天空。'],
      unavailable: ['暂无最新数据', '目前无法评估这里的云量。'],
    },
    cloud: '云量',
    solar: '太阳风 · NOAA',
    solarUnavailable: '暂无最新数据',
    auroraChance: 'NOAA 模型极光概率',
    withoutClouds: '未计入云量',
    updated: '天气数据',
    demo: '设计演示 · 非当前天气',
    telegramTitle: 'Telegram 频道',
    telegramButton: '订阅 Telegram 频道',
    telegramSubtitle: '卫星云图与极光观测信号',
    telegramPending: '订阅 Telegram 频道',
    telegramSoon: '即将开放',
    telegramUnavailable: 'Telegram 频道尚未开放。',
  },
} as const;

function cloudState(conditions: CityConditions | undefined) {
  if (!conditions || conditions.cloudCover === null) return 'unavailable' as const;
  if (conditions.precipitationKind === 'snow') return 'snow' as const;
  if (conditions.precipitationKind === 'rain') return 'rain' as const;
  if (conditions.cloudCover >= 80) return 'cloudy' as const;
  if (conditions.cloudCover >= 26) return 'patchy' as const;
  return 'clear' as const;
}

function currentScene(city: CityId, conditions: CityConditions | undefined) {
  if (!conditions || conditions.cloudCover === null) {
    return { src: '/images/hero-' + city + '-cloudy.png', weather: 'unknown', night: false };
  }
  const phase = conditions.sunAltitude >= -1 ? 'day' : conditions.sunAltitude > -12 ? 'twilight' : 'night';
  const scene = selectVisualScene({
    city,
    phase,
    cloudCover: conditions.cloudCover,
    precipitation: conditions.precipitationKind,
    signal: conditions.signal,
    auroraModel: conditions.auroraModel,
  });
  if (phase === 'night' && scene.weather === 'clear' && conditions.auroraModel !== null && conditions.auroraModel >= 20) {
    return { src: '/images/hero-' + city + '-aurora.png', weather: 'clear', night: true };
  }
  if (scene.weather === 'rain') return { src: '/images/hero-' + city + '-rain.png', weather: 'rain', night: phase === 'night' };
  if (scene.weather === 'clouds' || scene.weather === 'breaks') {
    return { src: '/images/hero-' + city + '-cloudy.png', weather: scene.weather, night: phase === 'night' };
  }
  if (phase === 'day') return { src: '/images/hero-' + city + '-day.png', weather: 'clear', night: false };
  return { src: scene.src, weather: scene.weather, night: phase === 'night' };
}

export default function HomePage() {
  const [language] = useState<Language>('ru');
  const [city, setCity] = useState<CityId>('murmansk');
  const [data, setData] = useState<LiveConditions | null>(null);
  const [demoScene, setDemoScene] = useState<DemoScene>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('city');
    const initialCity = requested && CITY_IDS.includes(requested as CityId) ? (requested as CityId) : 'murmansk';
    setCity(initialCity);
    const scene = params.get('scene');
    if (scene === 'aurora' || scene === 'day' || scene === 'clouds' || scene === 'snow') setDemoScene(scene);
    sendAnalytics('page_view', initialCity, 'ru');

    let active = true;
    const refresh = async () => {
      // Don't waste mobile battery/traffic if tab is hidden in background
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      try {
        const response = await fetch('/api/conditions', { cache: 'no-store' });
        if (!response.ok) throw new Error('Conditions unavailable');
        const next = (await response.json()) as LiveConditions;
        if (active) setData(next);
      } catch {
        if (active) setData(null);
      }
    };

    void refresh();
    const timer = window.setInterval(refresh, 60_000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const t = copy[language];
  const demoConditions = demoScene
    ? ({
        aurora: { sunAltitude: -18, cloudCover: 7, precipitationKind: 'none', signal: 'green', auroraModel: 58 },
        day: { sunAltitude: 15, cloudCover: 8, precipitationKind: 'none', signal: 'red', auroraModel: 35 },
        clouds: { sunAltitude: -18, cloudCover: 94, precipitationKind: 'none', signal: 'red', auroraModel: 43 },
        snow: { sunAltitude: -18, cloudCover: 94, precipitationKind: 'snow', signal: 'red', auroraModel: 43 },
      }[demoScene] as CityConditions)
    : null;
  const conditions = demoConditions || data?.cities[city];
  const state = cloudState(conditions);
  const visual = currentScene(city, conditions);
  const [statusTitle, statusBody] = t.conditions[state];
  const updated = conditions?.weatherTime
    ? new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Europe/Moscow',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(conditions.weatherTime))
    : null;
  const solarSpeed = data?.solarWind.speed ?? null;
  const solarBz = data?.solarWind.bz ?? null;
  const auroraChance = !demoScene ? conditions?.auroraModel : null;

  const faqItems = [
    {
      q: 'Во сколько лучше всего наблюдать сияние?',
      a: 'Пик геомагнитных суббурь в Мурманской области чаще всего наступает с 21:00 до 02:00 МСК. Главное условие — астрономическая темнота и отсутствие сплошной облачности на севере.',
    },
    {
      q: 'Куда ехать: в Териберку или Кировск?',
      a: 'В Териберке открытый северный горизонт над морем и нет городского света. В Кировске часто ясное небо над Хибинами, когда побережье затянуто циклоном с моря.',
    },
    {
      q: 'Что означают цифры солнечного ветра (скорость и Bz)?',
      a: 'Скорость солнечного ветра выше 400 км/с и отрицательный Bz (со знаком минус, например Bz -4 нТл) означают активную накачку энергии в магнитосферу — это предвестник ярких всполохов.',
    },
  ];

  return (
    <main className={'sky-page sky-page--' + visual.weather + (visual.night ? ' sky-page--night' : '')}>
      <div className="sky-backdrop" style={{ backgroundImage: 'url(' + visual.src + ')' }} aria-hidden="true" />
      <div className="sky-shade" aria-hidden="true" />
      <div className="sky-shell">
        <header className="sky-header">
          <Link className="sky-brand" href="/" aria-label="На Севере — сиять">
            <span className="sky-brand-mark" aria-hidden="true">
              ✨
            </span>
            <span>{t.brand}</span>
          </Link>
          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="sky-header-channel-pill"
            aria-label="Telegram-канал"
          >
            <Send size={14} aria-hidden="true" />
            <span>Канал @na_severe_siyat</span>
          </a>
        </header>

        <div className="sky-main">
          {demoScene && <div className="sky-demo-badge">{t.demo}</div>}
          <p className="sky-eyebrow">{t.eyebrow}</p>
          <h1 className="sky-landing-title">{t.title}</h1>

          <nav className="sky-cities" aria-label="Выбрать место">
            {CITY_IDS.map((id) => (
              <button
                key={id}
                type="button"
                className={city === id ? 'is-active' : ''}
                aria-pressed={city === id}
                onClick={() => {
                  if (city !== id) {
                    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                      navigator.vibrate?.(12);
                    }
                    sendAnalytics('city_change', id, 'ru');
                  }
                  setCity(id);
                }}
              >
                <MapPin size={16} aria-hidden="true" />
                {CITIES[id].nameRu}
              </button>
            ))}
          </nav>

          <section className="sky-result" aria-live="polite" aria-label={t.current}>
            <div className="sky-result-meta">
              <span className="sky-pulse" aria-hidden="true" />
              {t.current}
            </div>
            <h2>{statusTitle}</h2>
            {statusBody && <p>{statusBody}</p>}

            {state !== 'unavailable' && (
              <div className="sky-facts">
                <strong>
                  {t.cloud} {Math.round(conditions!.cloudCover!)}%
                </strong>
                <span>{demoScene ? t.demo : updated ? t.updated + ' · ' + updated + ' МСК' : t.updated}</span>
              </div>
            )}

            {data && !demoScene && (
              <div className="sky-solar" aria-label={t.solar}>
                <span className="sky-solar-title">{t.solar}</span>
                {solarSpeed !== null && <strong>{Math.round(solarSpeed)} км/с</strong>}
                {solarBz !== null && (
                  <strong>
                    Bz {solarBz > 0 ? '+' : ''}
                    {solarBz.toFixed(1)} нТ
                  </strong>
                )}
                {solarSpeed === null && solarBz === null && <span>{t.solarUnavailable}</span>}
                {auroraChance !== null && auroraChance !== undefined && (
                  <span className="sky-aurora-chance">
                    {t.auroraChance} <strong>{Math.round(auroraChance)}%</strong> · {t.withoutClouds}
                  </span>
                )}
              </div>
            )}
          </section>

          <section className="sky-telegram" aria-label={t.telegramTitle}>
            <a
              className="sky-telegram-button"
              href={CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sendAnalytics('telegram_click', city, 'ru', conditions?.signal)}
            >
              <span className="sky-telegram-icon">
                <Send size={20} fill="currentColor" aria-hidden="true" />
              </span>
              <span className="sky-telegram-label">
                {t.telegramButton}
                <small>{t.telegramSubtitle}</small>
              </span>
              <ArrowUpRight size={20} aria-hidden="true" />
            </a>
          </section>

          {/* SEO & Hunter Guide Section for High Search Ranking */}
          <section className="sky-seo-guide" aria-label="Памятка охотника за сиянием">
            <h3 className="sky-seo-heading">
              <Compass size={17} aria-hidden="true" />
              <span>Гид по наблюдению на Кольском полуострове</span>
            </h3>
            <div className="sky-faq-list">
              {faqItems.map((item, idx) => (
                <div key={idx} className={'sky-faq-item' + (faqOpen === idx ? ' is-open' : '')}>
                  <button
                    type="button"
                    className="sky-faq-question"
                    onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                    aria-expanded={faqOpen === idx}
                  >
                    <span>{item.q}</span>
                    <ChevronDown size={16} aria-hidden="true" />
                  </button>
                  {faqOpen === idx && <p className="sky-faq-answer">{item.a}</p>}
                </div>
              ))}
            </div>
            <p className="sky-seo-note">
              <Sparkles size={14} aria-hidden="true" />
              <span>
                Сайт отслеживает полярную ночь, облачность над Мурманском, Териберкой и Кировском (Хибины) и сопоставляет
                их с геофизической моделью NOAA SWPC каждые 60 секунд.
              </span>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
