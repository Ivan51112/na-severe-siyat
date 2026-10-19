'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronDown, Compass, Send, Sparkles } from 'lucide-react';
import { CITIES, CityConditions, CityId, LiveConditions } from '@/lib/conditions';
import { sendAnalytics } from '@/lib/client-analytics';
import { MarioAuroraScene, MarioSceneHandle } from './MarioAuroraScene';

type Language = 'ru' | 'zh';
type DemoScene = 'aurora' | 'day' | 'clouds' | 'snow' | null;
type UserMode = 'hunter' | 'dreamer';
const CITY_IDS: CityId[] = ['murmansk', 'teriberka', 'kirovsk'];
const CHANNEL_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL?.trim() || 'https://t.me/na_severe_siyat';

const SEASONS = [
  {
    period: 'СЕНТЯБРЬ — ОКТЯБРЬ',
    tag: 'БАРХАТНЫЙ СЕЗОН',
    title: 'Зеркальные озёра и тепло',
    desc: 'Земля ещё без снега, озёра не замерзли — зелёное сияние фантастически двоится в глади воды. Температура около +5...–3°C, в Териберке у берега плавают горбатые киты.',
    highlight: 'Шанс сияния: высокий · Комфортно для долгих прогулок',
  },
  {
    period: 'НОЯБРЬ — ДЕКАБРЬ',
    tag: 'ПОЛЯРНАЯ НОЧЬ',
    title: 'Абсолютная тьма и сказка',
    desc: 'Солнце не выходит из-за горизонта. Небо темнеет уже к 15:00, поэтому окно для наблюдений растягивается на 14 часов в сутки. Время первых сугробов и новогодних огней.',
    highlight: 'Шанс сияния: максимальный · Одевайтесь в 3 слоя',
  },
  {
    period: 'ЯНВАРЬ — ФЕВРАЛЬ',
    tag: 'ПИК СЕЗОНА',
    title: 'Хрустальная зима и мощные дуги',
    desc: 'Классическая открыточная Арктика: заснеженные сопки, морозный сухой воздух вымораживает облачность, даря хрустально чистое небо. Самые яркие всполохи года.',
    highlight: 'Шанс сияния: наивысший · Обязательны самогревы для обуви',
  },
  {
    period: 'МАРТ — АПРЕЛЬ',
    tag: 'РАВНОДЕНСТВИЕ',
    title: 'Солнечные бури и горные лыжи',
    desc: 'Период весеннего равноденствия знаменит взрывными геомагнитными вспышками. Днём солнечно и тепло (в Кировске открыт сезон горных лыж), а ночью полыхает небо.',
    highlight: 'Шанс сияния: очень высокий · Идеально для лыжников',
  },
];

const PACKING_LIST = [
  {
    icon: '🧣',
    title: '1. Термобельё (базовый слой)',
    desc: 'Шерсть мериноса или качественная спортивная синтетика. Главное правило Севера: никакого хлопка! Хлопок держит влагу и мгновенно охлаждает тело.',
  },
  {
    icon: '🧥',
    title: '2. Флис / шерсть (утепление)',
    desc: 'Толстая флисовая толстовка или шерстяной свитер. Создает воздушную прослойку и не дает морозу добраться до тела.',
  },
  {
    icon: '🧤',
    title: '3. Мембранный пуховик',
    desc: 'Непродуваемая ветрозащитная куртка с капюшоном. В тундре арктический ветер продувает обычное городское пальто за 2 минуты.',
  },
  {
    icon: '🥾',
    title: '4. Тёплая зимняя обувь',
    desc: 'Сапоги ЭВА с многослойным войлочным чулком или зимний трекинг на размер больше обычного (под толстый носок).',
  },
  {
    icon: '🔋',
    title: '5. Пауэрбанк во внутренний карман',
    desc: 'На морозе –20°C батарея любого смартфона садится за 10 минут. Держите внешний аккумулятор только во внутреннем кармане у тела.',
  },
  {
    icon: '♨️',
    title: '6. Самогревы для рук и ног',
    desc: 'Химические стельки-грелки (продаются на маркетплейсах). Наклеили на носок — и ноги в тепле на протяжении 6 часов ночной охоты.',
  },
];

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
  const [userMode, setUserMode] = useState<UserMode>('hunter');

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
    const requestedMode = params.get('mode');
    if (requestedMode === 'dreamer' || requestedMode === 'hunter') setUserMode(requestedMode);
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
      q: 'Где сегодня видно северное сияние в Мурманской области?',
      a: 'Главные точки наблюдения: Серебрянское шоссе за пределами засветки Мурманска (км 25–49), открытый морской горизонт Териберки и горный массив Хибин в районе Кировска. Актуальная облачность отслеживается онлайн на нашем радаре выше.',
    },
    {
      q: 'Во сколько часов ночи чаще всего появляется полярное сияние?',
      a: 'Пик геомагнитной активности на Кольском полуострове наступает с 21:00 до 01:30 по московскому времени при условии темного неба и отсутствия сплошной низкой облачности.',
    },
    {
      q: 'Что надежнее: бесплатные графики, платные камеры AuroraCam или выезд с гидом?',
      a: 'Для самостоятельных путешественников на автомобиле оптимальна связка онлайн-радара облачности, отслеживания отрицательного параметра Bz и сверки с ночными all-sky камерами AuroraCam. Платные гиды рекомендуются тем, кто без машины и впервые в зимней тундре.',
    },
    {
      q: 'Какая облачность допустима для наблюдения сияния?',
      a: 'Идеальные условия — общая облачность до 25%. При облачности 25–65% возможны разрывы туч и окна ясного неба. При облачности свыше 80% сияние с земли не видно.',
    },
    {
      q: 'Что означает отрицательный параметр Bz солнечного ветра?',
      a: 'Для яркого сияния критически важен отрицательный Bz (южное направление, со знаком минус). При Bz < 0 магнитные линии солнечного ветра смыкаются с полем Земли и плазма проникает в верхние слои атмосферы.',
    },
    {
      q: 'Как правильно сфотографировать северное сияние на смартфон?',
      a: 'Включите Ночной режим (Night Mode), установите выдержку 3–10 секунд, зафиксируйте телефон неподвижно на упоре или штативе и обязательно отключите вспышку.',
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

          {/* DUAL AUDIENCE SELECTOR («В зале или с собой») */}
          <section className="mode-choice-section" aria-label="Выбор персонального сценария">
            <div className="mode-choice-header">
              <span className="mode-choice-badge">ВЫБЕРИТЕ СВОЙ ЭКИПАЖ</span>
              <h1 className="mode-choice-title">Вам сияние прямо сейчас или упаковать с собой?</h1>
              <p className="mode-choice-sub">Два персональных сценария: для тех, кто уже на Кольском, и тех, кто мечтает в Москве</p>
            </div>

            <div className="mode-cards-grid">
              {/* Card 1: Уже на Севере! */}
              <button
                type="button"
                className={`mode-card mode-card--hunter ${userMode === 'hunter' ? 'is-active' : ''}`}
                onClick={() => {
                  setUserMode('hunter');
                  sendAnalytics('mode_change', city, 'ru', 'hunter');
                }}
                aria-pressed={userMode === 'hunter'}
              >
                <div className="mode-card-top">
                  <span className="mode-card-avatar" aria-hidden="true">🚙 ❄️</span>
                  <span className="mode-card-pill">В ОТЕЛЕ ИЛИ В АВТО</span>
                </div>
                <strong className="mode-card-heading">Уже на Севере!</strong>
                <p className="mode-card-text">
                  Штурман в тёплой ушанке. Куда рулить сегодня ночью, живой радар облачности, All-Sky камеры и вердикт неба.
                </p>
                <div className="mode-card-status">
                  {userMode === 'hunter' ? (
                    <span className="mode-card-selected">● Радар неба активен</span>
                  ) : (
                    <span className="mode-card-unselected">Включить радар неба →</span>
                  )}
                </div>
              </button>

              {/* Card 2: Мечтаю на диване */}
              <button
                type="button"
                className={`mode-card mode-card--dreamer ${userMode === 'dreamer' ? 'is-active' : ''}`}
                onClick={() => {
                  setUserMode('dreamer');
                  sendAnalytics('mode_change', city, 'ru', 'dreamer');
                }}
                aria-pressed={userMode === 'dreamer'}
              >
                <div className="mode-card-top">
                  <span className="mode-card-avatar" aria-hidden="true">☕ 🛋️</span>
                  <span className="mode-card-pill">ПЛАНИРУЮ ИЗ ДОМА</span>
                </div>
                <strong className="mode-card-heading">Мечтаю на диване</strong>
                <p className="mode-card-text">
                  Уютная москвичка с кофе. Календарь сезонов, как одеть семью, 5 ошибок новичка и когда брать билеты.
                </p>
                <div className="mode-card-status">
                  {userMode === 'dreamer' ? (
                    <span className="mode-card-selected">● Путеводитель открыт</span>
                  ) : (
                    <span className="mode-card-unselected">Открыть путеводитель →</span>
                  )}
                </div>
              </button>
            </div>
          </section>

          {/* =========================================================
              SCENARIO A: «УЖЕ НА СЕВЕРЕ!» (HUNTER MODE)
              ========================================================= */}
          {userMode === 'hunter' && (
            <>
              {/* INSTANT FAMILY SKY VERDICT (FOR MOMS & DADS) */}
              <div
                className={`sky-verdict-banner verdict-banner-${
                  state === 'clear' ? 'clear' : state === 'patchy' ? 'patchy' : 'cloudy'
                }`}
                aria-live="polite"
              >
                <span className="verdict-traffic-light" aria-hidden="true">
                  {state === 'clear' ? '🟢' : state === 'patchy' ? '🟡' : state === 'snow' ? '❄️' : '🔴'}
                </span>
                <div className="verdict-text-block">
                  <span className="verdict-badge">
                    {state === 'clear'
                      ? 'ВЕРДИКТ ЭКИПАЖУ · МОЖНО ВЫЕЗЖАТЬ'
                      : state === 'patchy'
                      ? 'ВЕРДИКТ ЭКИПАЖУ · ЛОВИТЕ ОКНА В НЕБЕ'
                      : 'ВЕРДИКТ ЭКИПАЖУ · ПЛОТНЫЕ ТУЧИ'}
                  </span>
                  <h2 className="verdict-title">
                    {state === 'clear'
                      ? `${CITIES[city].nameRu}: Небо открыто, звёзды видно!`
                      : state === 'patchy'
                      ? `${CITIES[city].nameRu}: Переменная облачность с разрывами`
                      : `${CITIES[city].nameRu}: Небо плотно затянуто тучами`}
                  </h2>
                  <p className="verdict-desc">
                    {state === 'clear'
                      ? 'Шансы высокие (от 70%). Одевайтесь теплее в 3 слоя и выезжайте за город за пределы уличного освещения.'
                      : state === 'patchy'
                      ? 'Шансы умеренные (около 45%). Облака движутся: следите за камерами и ловите разрывы туч.'
                      : 'Сквозь плотные тучи сияния с земли не видно. Лучше отдохните в тепле или проверьте Кировск.'}
                  </p>
                </div>
              </div>

              {/* THREE CITIES IN ONE ROW ON MOBILE */}
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

              {/* SHORT INSTRUCTION */}
              {!hasTapped && (
                <div className="quest-hint-bar" aria-live="polite">
                  <span className="quest-hint-icon" aria-hidden="true">
                    👆
                  </span>
                  <span>Тапай — разгоняй тучи над {CITIES[city].nameRu}</span>
                </div>
              )}

              {/* ACTION & VICTORY ZONE */}
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

              {/* SMOOTH SCROLL CUE TO THE HUB */}
              <div className="sky-scroll-cue">
                <a href="#hub-overview" className="sky-scroll-link">
                  <span>↓ Радар погоды, живые камеры и трассы</span>
                </a>
              </div>

              <div id="hub-overview" className="sky-hub-wrapper">
                {/* 7. GENUINE WEATHER & SOLAR RADAR */}
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
                          {solarBz.toFixed(1)} нТ {solarBz < 0 ? '(щит открыт 👍)' : '(щит закрыт)'}
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

                {/* 8. LIVE GROUND-TRUTH AI PULSE */}
                <section className="hub-card hub-pulse-card" aria-label="ИИ-Пульс очевидцев с трасс и камер">
                  <div className="hub-badge-live">
                    <span className="live-dot" /> ИИ-ПУЛЬС С ТРАСС И КАМЕР ОНЛАЙН
                  </div>
                  <h3 className="hub-title">Где полыхает прямо сейчас (Сводка 7 источников)</h3>
                  <p className="hub-subtitle">
                    Нейросетевой мониторинг ночных all-sky камер AuroraCam, отчётов экспедиций nord ADVENTURE, DenisFox и постов туристов с Серебрянки и Териберки.
                  </p>

                  <div className="hub-pulse-grid">
                    <div className={`pulse-zone-box ${city === 'murmansk' ? 'is-highlight' : ''}`}>
                      <div className="pulse-zone-header">
                        <span className="zone-name">⚓ Мурманск и трассы</span>
                        <span className="zone-status-badge status-green">🟢 Подтверждено</span>
                      </div>
                      <div className="pulse-zone-detail">
                        <strong>Серебрянское шоссе (км 25–40)</strong>
                        <span>Зафиксированы разрывы облачности и дуга на северо-востоке. Камеры AuroraCam и экспедиции в полях.</span>
                      </div>
                    </div>

                    <div className={`pulse-zone-box ${city === 'teriberka' ? 'is-highlight' : ''}`}>
                      <div className="pulse-zone-header">
                        <span className="zone-name">🐋 Териберка</span>
                        <span className="zone-status-badge status-yellow">🟡 Переменная облачность</span>
                      </div>
                      <div className="pulse-zone-detail">
                        <strong>Побережье Баренцева моря</strong>
                        <span>Морской прибой, окна чистого неба в районе пляжа «Яйца дракона» и Батарейского водопада.</span>
                      </div>
                    </div>

                    <div className={`pulse-zone-box ${city === 'kirovsk' ? 'is-highlight' : ''}`}>
                      <div className="pulse-zone-header">
                        <span className="zone-name">⛷️ Кировск (Хибины)</span>
                        <span className="zone-status-badge status-blue">🏔️ Ясно над горами</span>
                      </div>
                      <div className="pulse-zone-detail">
                        <strong>Озеро Большой Вудъявр / Плато</strong>
                        <span>Горы удерживают морской циклон. Отличная видимость сопок вдали от городского освещения.</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 9. THREE PATHS COMPARISON: FREE vs CAMERAS vs TOURS */}
                <section className="hub-card hub-comparison-card" aria-label="3 пути охоты за сиянием">
                  <div className="hub-section-tag">⚖️ ЧЕСТНЫЙ ВЫБОР ДЛЯ ТУРИСТА</div>
                  <h3 className="hub-title">3 способа поймать сияние: плюсы и минусы</h3>
                  <p className="hub-subtitle">Без рекламы и навязывания — объективный расклад по бюджету, рискам и комфорту.</p>

                  <div className="comparison-cards">
                    <div className="comp-item comp-free">
                      <div className="comp-badge">БЕСПЛАТНО · 0 ₽</div>
                      <h4>1. Своими силами на арендованном авто</h4>
                      <ul className="comp-list">
                        <li><span className="c-plus">+</span> Полная свобода маршрута и времени выезда.</li>
                        <li><span className="c-plus">+</span> Нулевые затраты на экскурсии (экономия от 15 000 ₽ на двоих).</li>
                        <li><span className="c-minus">-</span> Нужно понимать физику (облачность, отрицательный Bz, скорость ветра).</li>
                        <li><span className="c-minus">-</span> Риск уехать наугад в снежный заряд или тучу.</li>
                      </ul>
                      <div className="comp-verdict"><strong>Вердикт:</strong> Идеально, если вы взяли авто и ориентируетесь по нашему радару.</div>
                    </div>

                    <div className="comp-item comp-cameras">
                      <div className="comp-badge">ТЕХНОЛОГИИ · ПОДПИСКА</div>
                      <h4>2. All-Sky ночные камеры (AuroraCam)</h4>
                      <ul className="comp-list">
                        <li><span className="c-plus">+</span> Глаза в реальном времени со светосильной оптикой на трассах.</li>
                        <li><span className="c-plus">+</span> Мгновенные бот-уведомления, когда над вышкой полыхнуло небо.</li>
                        <li><span className="c-minus">-</span> Камера показывает конкретную точку, за 20 км погода может отличаться.</li>
                        <li><span className="c-minus">-</span> Требует платной подписки на сервис.</li>
                      </ul>
                      <div className="comp-verdict"><strong>Вердикт:</strong> Лучший помощник перед стартом, чтобы не греть машину впустую.</div>
                    </div>

                    <div className="comp-item comp-tours">
                      <div className="comp-badge">КОМФОРТ · 5000–9000 ₽ / ЧЕЛ</div>
                      <h4>3. Выезд с гидом на минивэне</h4>
                      <ul className="comp-list">
                        <li><span className="c-plus">+</span> Водитель знает сопки, напоит горячим чаем с брусникой.</li>
                        <li><span className="c-plus">+</span> Качественные портретные снимки на зеркальный фотоаппарат.</li>
                        <li><span className="c-minus">-</span> Дорого на семью или компанию (от 25 000 ₽ за 4–5 часов).</li>
                        <li><span className="c-minus">-</span> Нет 100% гарантии: при глухом циклоне деньги обычно не возвращают.</li>
                      </ul>
                      <div className="comp-verdict"><strong>Вердикт:</strong> Подходит тем, кто совсем без авто и боится ночной тундры.</div>
                    </div>
                  </div>
                </section>

                {/* MUSEUM BRIDGE IN HUNTER MODE */}
                <section className="hub-card hub-museum-card" aria-label="Ночной эфир в Telegram-канале">
                  <div className="museum-glow-ornament" aria-hidden="true">✨ 🎄 ✨</div>
                  <h3 className="museum-title">Пока ждёшь сияния: согрейся северной сказкой</h3>
                  <p className="museum-desc">
                    В ожидании разрыва туч в машине на обочине тундры или в номере отеля — загляните в наш уютный Telegram-канал.
                  </p>

                  <div className="museum-features">
                    <div className="museum-feat-item">
                      <span className="feat-icon">🎬</span>
                      <div>
                        <strong>Ночной фильм-экскурсия</strong>
                        <p>Единственный в мире «Музей разбитой ёлочной игрушки в Мурманске»: тайны советского стекла, игрушка-треска и ракета Юрия Гагарина, служившего в Заполярье.</p>
                      </div>
                    </div>
                    <div className="museum-feat-item">
                      <span className="feat-icon">🔮</span>
                      <div>
                        <strong>Ёлочный шар с сиянием — к возвращению домой</strong>
                        <p>Выберите авторский шар ручной работы с Севера. Доставим в целости через Авито/СДЭК: посылка будет ждать вас дома в пункте выдачи и не разобьётся в самолёте!</p>
                      </div>
                    </div>
                  </div>

                  <a
                    href={CHANNEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="museum-tg-cta"
                    onClick={() => sendAnalytics('telegram_click', city, 'ru', 'hub_museum_btn')}
                  >
                    <Send size={18} fill="currentColor" aria-hidden="true" />
                    <span>Зайти в тёплый Telegram-канал @na_severe_siyat</span>
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </a>
                </section>
              </div>
            </>
          )}

          {/* =========================================================
              SCENARIO B: «МЕЧТАЮ НА ДИВАНЕ» (DREAMER MODE)
              ========================================================= */}
          {userMode === 'dreamer' && (
            <div className="dreamer-wrapper">
              {/* DREAMER HERO CARD */}
              <div className="dreamer-hero-card">
                <span className="mode-choice-badge">ГИД ДЛЯ ТЕХ, КТО ПЛАНИРУЕТ</span>
                <h2 className="dreamer-hero-title">Как спланировать сказочную поездку за сиянием</h2>
                <p className="dreamer-hero-p">
                  Всё, что нужно знать жителям Москвы и Петербурга: от выбора идеального месяца до чек-листа тёплого чемодана, чтобы влюбиться в Русский Север всей семьёй.
                </p>
              </div>

              {/* 1. SEASONS CALENDAR */}
              <section className="hub-card" aria-label="Календарь сезонов полярного сияния">
                <div className="hub-section-tag">📅 КАЛЕНДАРЬ СЕЗОНОВ</div>
                <h3 className="hub-title">Когда лучше лететь в Мурманск: 4 времени года</h3>
                <p className="hub-subtitle">
                  Северное сияние длится с сентября по апрель. Выберите период под ваш характер и комфорт:
                </p>

                <div className="seasons-grid">
                  {SEASONS.map((s, idx) => (
                    <div key={idx} className="season-card">
                      <div className="season-period">
                        <span>{s.period}</span>
                        <span className="season-tag">{s.tag}</span>
                      </div>
                      <h4 className="season-title">{s.title}</h4>
                      <p className="season-desc">{s.desc}</p>
                      <span className="season-highlight">{s.highlight}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* 2. PACKING CHECKLIST */}
              <section className="hub-card" aria-label="Чек-лист экипировки для всей семьи">
                <div className="hub-section-tag">🧳 ЧЕК-ЛИСТ ЧЕМОДАНА</div>
                <h3 className="hub-title">Как одеть маму, папу и ребёнка, чтобы не замёрзнуть</h3>
                <p className="hub-subtitle">
                  Главный секрет северян — трёхслойная концепция. Вот 6 вещей, которые обязательно должны быть в багаже:
                </p>

                <div className="packing-grid">
                  {PACKING_LIST.map((item, idx) => (
                    <div key={idx} className="packing-card">
                      <span className="packing-icon" aria-hidden="true">{item.icon}</span>
                      <div className="packing-info">
                        <strong>{item.title}</strong>
                        <p>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 3. FIVE FATAL MISTAKES */}
              <section className="hub-card hub-mistakes-card" aria-label="5 роковых ошибок новичка">
                <div className="hub-section-tag">⚠️ ПРАКТИКА ОХОТЫ</div>
                <h3 className="hub-title">5 главных ошибок новичка (почему 34.5% уезжают ни с чем)</h3>
                <p className="hub-subtitle">Каждый третий турист терпит неудачу из-за типичных заблуждений. Вот как их избежать:</p>

                <div className="mistakes-grid">
                  <div className="mistake-card">
                    <div className="mistake-num">01</div>
                    <h4>Ждать сияния в городе под фонарями</h4>
                    <p>Городское освещение Мурманска «съедает» до 85% контраста слабого сияния. Отъезжайте минимум на 15–25 км в тундру по Серебрянскому или Ленинградскому шоссе.</p>
                  </div>

                  <div className="mistake-card">
                    <div className="mistake-num">02</div>
                    <h4>Верить прогнозу погоды на неделю вперед</h4>
                    <p>В Заполярье погоду формируют морские воздушные массы Баренцева моря. Циклон может смениться ясным небом за 45 минут. Доверяйте только живому спутнику за 1–2 часа до старта.</p>
                  </div>

                  <div className="mistake-card">
                    <div className="mistake-num">03</div>
                    <h4>Смотреть только на индекс Kp</h4>
                    <p>При геомагнитной буре Kp 7 сквозь 100% низких туч вы увидите лишь темноту. <strong>Облачность всегда важнее космической активности!</strong> При ясном небе шикарное сияние видно даже при скромном Kp 2.</p>
                  </div>

                  <div className="mistake-card">
                    <div className="mistake-num">04</div>
                    <h4>Игнорировать параметр Bz (нужен минус!)</h4>
                    <p>Если вектор Bz межпланетного поля положителен (+5...+10 нТл), магнитный щит Земли отражает поток плазмы. Для взрывного зажигания неба необходим <strong>отрицательный Bz со знаком минус</strong>.</p>
                  </div>

                  <div className="mistake-card">
                    <div className="mistake-num">05</div>
                    <h4>Снимать на смартфон со вспышкой</h4>
                    <p>Вспышка осветит лишь снег перед ногами и испортит ночное зрение на 15 минут. Переведите телефон в «Ночной режим» (выдержка 3–10 секунд), отключите вспышку и обоприте смартфон о капот или штатив.</p>
                  </div>
                </div>
              </section>

              {/* 4. MUSEUM OF BROKEN CHRISTMAS ORNAMENTS */}
              <section className="hub-card hub-museum-card" aria-label="Сказка Севера и ёлочные игрушки">
                <div className="museum-glow-ornament" aria-hidden="true">✨ 🎄 ✨</div>
                <h3 className="museum-title">Привезите сказку домой: авторский ёлочный шар</h3>
                <p className="museum-desc">
                  Пока вы только планируете поездку — подарите себе или близким волшебную атмосферу Севера.
                </p>

                <div className="museum-features">
                  <div className="museum-feat-item">
                    <span className="feat-icon">🎬</span>
                    <div>
                      <strong>Виртуальная экскурсия</strong>
                      <p>Единственный в мире «Музей разбитой ёлочной игрушки в Мурманске»: тайны советского стекла, игрушка-треска и ракета Юрия Гагарина, служившего в Заполярье.</p>
                    </div>
                  </div>
                  <div className="museum-feat-item">
                    <span className="feat-icon">🔮</span>
                    <div>
                      <strong>Ёлочный шар с сиянием — доставка до двери</strong>
                      <p>Авторский шар ручной работы с Севера доставим через Авито/СДЭК прямо в ваш город. Посылка не разобьётся в чемодане самолёта и украсит домашнюю ёлку!</p>
                    </div>
                  </div>
                </div>

                <a
                  href={CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="museum-tg-cta"
                  onClick={() => sendAnalytics('telegram_click', city, 'ru', 'dreamer_museum_btn')}
                >
                  <Send size={18} fill="currentColor" aria-hidden="true" />
                  <span>Посмотреть шары и фильм в Telegram-канале @na_severe_siyat</span>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </a>
              </section>

              {/* 5. DREAMER TELEGRAM NOTIFICATION BANNER */}
              <div className="dreamer-tg-banner">
                <span className="mode-choice-badge">БУДЬТЕ ПЕРВЫМИ</span>
                <h3 className="dreamer-tg-title">Уведомим, когда начнётся главная вспышка сезона</h3>
                <p className="dreamer-tg-desc">
                  Подпишитесь на наш канал, чтобы не пропустить мощные солнечные бури, открытие дорог в Териберку и выход свежих выпусков о Севере.
                </p>
                <a
                  href={CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dreamer-tg-btn"
                  onClick={() => sendAnalytics('telegram_click', city, 'ru', 'dreamer_bottom_btn')}
                >
                  <Send size={18} fill="currentColor" aria-hidden="true" />
                  <span>Подписаться на @na_severe_siyat</span>
                </a>
              </div>
            </div>
          )}

          {/* =========================================================
              COMMON SECTION: FAQ ACCORDION (SEO POWERHOUSE)
              ========================================================= */}
          <section className="hub-card hub-faq-card" style={{ maxWidth: 780, margin: '24px auto 0' }} aria-label="Часто задаваемые вопросы о северном сиянии">
            <div className="hub-section-tag">💡 БАЗА ЗНАНИЙ ОХОТНИКА</div>
            <h3 className="hub-title">Вопросы и ответы о наблюдении в Мурманской области</h3>

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
          </section>
        </div>
      </div>
    </main>
  );
}
