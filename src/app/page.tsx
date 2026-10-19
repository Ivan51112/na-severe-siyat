'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronDown, Compass, Send, Sparkles } from 'lucide-react';
import { CITIES, CityConditions, CityId, LiveConditions } from '@/lib/conditions';
import { sendAnalytics } from '@/lib/client-analytics';
import { MarioAuroraScene, MarioSceneHandle } from './MarioAuroraScene';

type Language = 'ru' | 'zh';
type DemoScene = 'aurora' | 'day' | 'clouds' | 'snow' | null;
const CITY_IDS: CityId[] = ['murmansk', 'teriberka', 'kirovsk'];
const CHANNEL_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL?.trim() || 'https://t.me/na_severe_siyat';

const copy = {
  ru: {
    brand: 'На Севере — сиять',
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
  },
  zh: {
    brand: '极光 / 摩尔曼斯克',
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

export default function HomePage() {
  const [language] = useState<Language>('ru');
  const [city, setCity] = useState<CityId>('murmansk');
  const [data, setData] = useState<LiveConditions | null>(null);
  const [demoScene, setDemoScene] = useState<DemoScene>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Quest progress (0..3) per city in current session
  const [cityProgress, setCityProgress] = useState<Record<CityId, number>>({
    murmansk: 0,
    teriberka: 0,
    kirovsk: 0,
  });
  const [hasTapped, setHasTapped] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const marioSceneRef = useRef<MarioSceneHandle | null>(null);

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
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
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

  const handleGameTap = (newProgress: number) => {
    if (!hasTapped) {
      setHasTapped(true);
      sendAnalytics('game_start', city, 'ru');
    }

    setCityProgress((prev) => ({
      ...prev,
      [city]: newProgress,
    }));

    if (newProgress === 3) {
      sendAnalytics('city_complete', city, 'ru');
      if (city === 'kirovsk') {
        sendAnalytics('quest_complete', city, 'ru');
      }
    }
  };

  const handleCityChange = (newCity: CityId) => {
    if (city !== newCity) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(15);
      }
      sendAnalytics('city_change', newCity, 'ru');
      setCity(newCity);
    }
  };

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
    <main className="sky-page sky-page--mario">
      <div className="sky-backdrop sky-backdrop--cosmic" aria-hidden="true" />
      <div className="sky-shade" aria-hidden="true" />
      <div className="sky-shell">
        {/* 1. COMPACT HEADER WITH DIRECT ROUND TELEGRAM BUTTON */}
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
            className="sky-header-tg-round"
            aria-label="Telegram-канал @na_severe_siyat"
            title="Открыть Telegram-канал"
            onClick={() => sendAnalytics('telegram_click', city, 'ru', 'header_round_btn')}
          >
            <Send size={18} fill="currentColor" aria-hidden="true" />
          </a>
        </header>

        <div className="sky-main">
          {demoScene && <div className="sky-demo-badge">{t.demo}</div>}

          {/* 2. THREE CITIES IN ONE ROW ON MOBILE */}
          <nav className="mario-city-nav" aria-label="Выбрать город">
            {CITY_IDS.map((id) => (
              <button
                key={id}
                type="button"
                className={city === id ? 'is-active' : ''}
                aria-pressed={city === id}
                onClick={() => handleCityChange(id)}
              >
                <span className="city-icon" aria-hidden="true">
                  {id === 'murmansk' ? '⚓' : id === 'teriberka' ? '🐋' : '⛷️'}
                </span>
                <span className="city-name">{CITIES[id].nameRu}</span>
                {cityProgress[id] === 3 && (
                  <span className="city-done-sparkle" aria-label="Пройдено">
                    ✨
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* 3. BIG GAME SCENE */}
          <MarioAuroraScene
            ref={marioSceneRef}
            city={city}
            progress={cityProgress[city]}
            onTap={handleGameTap}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled((prev) => !prev)}
          />

          {/* 4. SHORT INSTRUCTION: HIDES AFTER FIRST SUCCESSFUL TAP */}
          {!hasTapped && (
            <div className="quest-hint-bar" aria-live="polite">
              <span className="quest-hint-icon" aria-hidden="true">
                👆
              </span>
              <span>Тапай — разгоняй тучи</span>
            </div>
          )}

          {/* 5. RESERVED ACTION & VICTORY ZONE (FIXED MIN-HEIGHT TO PREVENT LAYOUT SHIFT) */}
          <div className="quest-action-zone">
            {cityProgress[city] < 3 ? (
              <button
                type="button"
                className="quest-tap-btn"
                onClick={() => marioSceneRef.current?.triggerJump()}
              >
                <span className="quest-btn-glow" aria-hidden="true" />
                <span className="quest-btn-icon" aria-hidden="true">
                  🍄
                </span>
                <span className="quest-btn-text">
                  <strong>РАЗОГНАТЬ ТУЧИ</strong>
                  <small>Удар {cityProgress[city] + 1} из 3</small>
                </span>
              </button>
            ) : city === 'murmansk' ? (
              <div className="quest-win-card">
                <p className="quest-win-msg">Ты зажёг сияние в Мурманске ✨</p>
                <button
                  type="button"
                  className="quest-next-btn"
                  onClick={() => handleCityChange('teriberka')}
                >
                  <span>Теперь в Териберку →</span>
                </button>
              </div>
            ) : city === 'teriberka' ? (
              <div className="quest-win-card">
                <p className="quest-win-msg">Сияет над Баренцевым морем ✨</p>
                <button
                  type="button"
                  className="quest-next-btn"
                  onClick={() => handleCityChange('kirovsk')}
                >
                  <span>Дальше — Кировск →</span>
                </button>
              </div>
            ) : (
              /* Kirovsk: Final Victory */
              <div className="quest-win-card quest-win-card--final">
                <p className="quest-win-msg">Теперь сияют и Хибины ✨</p>
                <p className="quest-final-invite">А теперь — на настоящую охоту!</p>
                <a
                  href={CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="quest-tg-main-btn"
                  onClick={() => sendAnalytics('telegram_click', city, 'ru', 'quest_final_btn')}
                >
                  <Send size={20} fill="currentColor" aria-hidden="true" />
                  <span>Продолжить в Telegram</span>
                </a>
              </div>
            )}
          </div>

          {/* 6. SMOOTH SCROLL CUE TO WEATHER DATA */}
          <div className="sky-scroll-cue">
            <a href="#weather-now" className="sky-scroll-link">
              <span>↓ Погода сейчас</span>
            </a>
          </div>

          {/* 7. GENUINE WEATHER DATA BELOW THE GAME */}
          <section id="weather-now" className="sky-result mario-result-box" aria-live="polite" aria-label={t.current}>
            <div className="sky-result-meta">
              <span className="sky-pulse" aria-hidden="true" />
              РАДАР ПОГОДЫ И НЕБА · {CITIES[city].nameRu.toUpperCase()}
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

            {/* Weather Block Telegram Banner */}
            <div className="weather-tg-card">
              <a
                href={CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="weather-tg-btn"
                onClick={() => sendAnalytics('telegram_click', city, 'ru', 'weather_block_btn')}
              >
                <Send size={18} fill="currentColor" aria-hidden="true" />
                <span>Оперативные спутниковые снимки в Telegram-канале</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
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
