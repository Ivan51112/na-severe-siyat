'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ExternalLink, MapPin, Navigation2 } from 'lucide-react';
import { CITIES, CityId, LiveConditions } from '@/lib/conditions';
import { HourlyPreview } from '../hourly-preview';
import { sendAnalytics } from '@/lib/client-analytics';

type Language = 'ru' | 'zh';
const CITY_IDS: CityId[] = ['murmansk', 'teriberka', 'kirovsk'];
const CHANNEL_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL;

const copy = {
  ru: {
    back: 'Вернуться к текущим условиям', brand: 'АВРОРА / МУРМАНСК', eyebrow: 'КАРТА И ПРОГНОЗ',
    title: 'Где искать сияние?', intro: 'Сравните три места. Текущую обстановку показываем по данным, а будущие часы — пока как макет.',
    mapTitle: 'Три места для наблюдения', mapNote: 'Схема расположения · не карта облачности',
    current: 'Условия сейчас', noData: 'Нет свежих данных', updated: 'Обновлено',
    good: 'Есть шанс увидеть', variable: 'Условия переменчивы', bad: 'Сейчас не видно',
    daylight: 'Пока слишком светло', clouds: 'Плотные облака', snow: 'Идёт снег', rain: 'Идёт дождь',
    twilight: 'Небо ещё светлое', patchy: 'Ищем просветы', low_aurora: 'Активность слабая',
    favorable: 'Небо тёмное и ясное', unavailable: 'Оценка недоступна',
    futureEyebrow: 'СЛЕДУЮЩИЕ ЧАСЫ', futureTitle: 'Когда лучше смотреть?',
    futureText: 'Почасовые и многодневные данные ещё не подключены. Ниже — образец того, как здесь будет выглядеть прогноз. Его проценты не относятся к сегодняшней ночи.',
    telegramTitle: 'Не хотите постоянно проверять карту?',
    telegramText: 'Когда подключим прогноз на сутки, изменения условий можно будет получать в Telegram.',
    telegram: 'Подписаться на сигналы', channelNote: 'Адрес канала пока не подключён',
    sourceNote: 'Текущая оценка: погода Open-Meteo, положение Солнца и модель NOAA. Будущий график ниже — учебный пример.',
  },
  zh: {
    back: '返回当前情况', brand: '极光 / 摩尔曼斯克', eyebrow: '地图与预报',
    title: '去哪里寻找极光？', intro: '比较三个地点。当前条件基于数据，未来几小时暂为设计示例。',
    mapTitle: '三个观测地点', mapNote: '位置示意图 · 非云量地图',
    current: '当前条件', noData: '暂无新数据', updated: '更新于',
    good: '可能看见极光', variable: '条件不稳定', bad: '目前无法看见',
    daylight: '目前太亮', clouds: '厚云遮蔽', snow: '正在下雪', rain: '正在下雨',
    twilight: '天空仍然较亮', patchy: '寻找云隙', low_aurora: '极光活动较弱',
    favorable: '夜空晴朗', unavailable: '评估不可用',
    futureEyebrow: '未来几小时', futureTitle: '什么时候更合适？',
    futureText: '逐小时和多日数据尚未接入。以下仅展示未来预报的界面设计，百分比不是今晚的预测。',
    telegramTitle: '不想一直查看地图？',
    telegramText: '接入全天预报后，您可以通过 Telegram 接收天气变化提醒。',
    telegram: '订阅极光信号', channelNote: '频道地址尚未接入',
    sourceNote: '当前评估：Open-Meteo 天气、太阳位置和 NOAA 模型。下方图表只是教学示例。',
  },
} as const;

export function ForecastClient({ initialCity, language }: { initialCity: CityId; language: Language }) {
  const [city, setCity] = useState<CityId>(initialCity);
  const [data, setData] = useState<LiveConditions | null>(null);

  useEffect(() => {
    sendAnalytics('forecast_view', initialCity, language);
    let active = true;
    const refresh = async () => {
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
    const timer = window.setInterval(refresh, 120_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const t = copy[language];
  const selected = data?.cities[city];
  const signal = selected?.signal || 'unknown';
  const reason = selected?.reason || 'unavailable';
  const updated = data?.fetchedAt
    ? new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'zh-CN', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' }).format(new Date(data.fetchedAt))
    : null;
  const status = signal === 'green' ? t.good : signal === 'yellow' ? t.variable : signal === 'red' ? t.bad : t.noData;

  return <main className="forecast-page">
    <div className="forecast-glow" aria-hidden="true" />
    <div className="forecast-shell">
      <header className="forecast-header">
        <Link href={'/?city=' + city + '&lang=' + language} className="forecast-back"><ArrowLeft size={18} aria-hidden="true" /><span>{t.back}</span></Link>
        <span className="forecast-brand">✳ &nbsp;{t.brand}</span>
      </header>

      <section className="forecast-intro">
        <p className="forecast-eyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
      </section>

      <div className="forecast-top-grid">
        <section className="forecast-map-card" aria-label={t.mapTitle}>
          <div className="forecast-section-header"><h2>{t.mapTitle}</h2><span>{t.mapNote}</span></div>
          <div className="forecast-map">
            <svg className="forecast-map-art" viewBox="0 0 660 440" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#163e50" /><stop offset="1" stopColor="#0a1b2b" /></linearGradient>
                <linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#294d4e" /><stop offset="1" stopColor="#142f37" /></linearGradient>
              </defs>
              <rect width="660" height="440" fill="url(#sea)" />
              <path d="M0 0 H446 C451 43 484 55 458 84 C436 109 464 143 496 152 C532 163 526 194 487 213 C463 224 472 258 449 270 C412 287 421 314 460 342 C492 365 501 390 476 440 H0 Z" fill="url(#land)" />
              <path d="M0 0 H446 C451 43 484 55 458 84 C436 109 464 143 496 152 C532 163 526 194 487 213 C463 224 472 258 449 270 C412 287 421 314 460 342 C492 365 501 390 476 440" fill="none" stroke="#6aafa0" strokeOpacity=".34" strokeWidth="2" />
              <path d="M85 0 C140 93 213 146 230 244 C242 311 286 350 320 440 M35 252 C123 226 216 213 300 260 C355 292 378 353 400 440" fill="none" stroke="#90b9ae" strokeOpacity=".13" strokeWidth="4" />
              <path d="M90 120 C170 124 245 141 300 190 C322 211 350 248 385 280" fill="none" stroke="#b9d8c8" strokeOpacity=".12" strokeWidth="3" strokeDasharray="5 9" />
            </svg>
            <span className="forecast-sea-label">{language === 'ru' ? 'БАРЕНЦЕВО МОРЕ' : '巴伦支海'}</span>
            {CITY_IDS.map((id) => <button key={id} type="button" className={'forecast-map-pin forecast-map-pin--' + id + (city === id ? ' is-active' : '')} onClick={() => setCity(id)} aria-pressed={city === id}>
              <span className="forecast-map-point"><MapPin size={16} aria-hidden="true" /></span>
              <span>{language === 'ru' ? CITIES[id].nameRu : CITIES[id].nameZh}</span>
            </button>)}
          </div>
          <div className="forecast-city-tabs">
            {CITY_IDS.map((id) => <button key={id} type="button" onClick={() => setCity(id)} aria-pressed={city === id} className={city === id ? 'is-active' : ''}>{language === 'ru' ? CITIES[id].nameRu : CITIES[id].nameZh}</button>)}
          </div>
        </section>

        <section className="forecast-current-card">
          <div className="forecast-current-heading"><Navigation2 size={18} aria-hidden="true" />{t.current}</div>
          <p className="forecast-current-city">{language === 'ru' ? CITIES[city].nameRu : CITIES[city].nameZh}</p>
          <h2>{status}</h2>
          <p className="forecast-current-reason">{t[reason]}</p>
          <div className="forecast-current-bottom">
            <span className={'forecast-condition-dot forecast-condition-dot--' + signal} aria-hidden="true" />
            <span>{updated ? t.updated + ' ' + updated + ' МСК' : t.noData}</span>
          </div>
        </section>
      </div>

      <section className="forecast-future">
        <p className="forecast-eyebrow">{t.futureEyebrow}</p>
        <h2>{t.futureTitle}</h2>
        <p>{t.futureText}</p>
        <HourlyPreview language={language} />
      </section>

      <section className="forecast-telegram">
        <div><h2>{t.telegramTitle}</h2><p>{t.telegramText}</p></div>
        {CHANNEL_URL
          ? <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="forecast-telegram-button" onClick={() => sendAnalytics('telegram_click', city, language, signal)}>{t.telegram}<ExternalLink size={18} aria-hidden="true" /></a>
          : <span className="forecast-telegram-button is-disabled">{t.telegram}</span>}
        <small>{CHANNEL_URL ? (language === 'ru' ? 'Канал проекта · внешняя ссылка' : '项目频道 · 外部链接') : t.channelNote}</small>
      </section>
      <p className="forecast-source-note">{t.sourceNote}</p>
    </div>
  </main>;
}
