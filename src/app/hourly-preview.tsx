'use client';

import { useState } from 'react';
import { Clock3 } from 'lucide-react';

type Language = 'ru' | 'zh';

// A design sample only. Never feed these values into the live sky signal.
const SAMPLE_VALUES: Array<number | null> = [
  12, 16, 20, 38, 60, 60, 60, 48, 35, 22, 12, 6,
  null, null, null, null, null, null, null, null, null, null, 5, 8,
];

const SAMPLE_HOURS = SAMPLE_VALUES.map((chance, index) => ({
  hour: `${String((20 + index) % 24).padStart(2, '0')}:00`,
  chance,
}));

const copy = {
  ru: {
    title: 'Когда шанс выше?',
    subtitle: 'Макет почасового графика на 24 часа',
    demo: 'УЧЕБНЫЙ ПРИМЕР · НЕ ПРОГНОЗ',
    comparison: 'В этом примере',
    low: '22:00 · 20%',
    high: '00:00–02:00 · 60%',
    timezone: 'Время МСК',
    nextDay: 'следующий день',
    daylight: 'светло',
    selected: 'Выбранный час',
    hint: 'Листайте часы по горизонтали и нажмите на столбец, чтобы посмотреть значение.',
    note: 'Проценты условные и не относятся к выбранному городу или текущей погоде. Реальный график появится после подключения и проверки модели прогноза на сутки.',
    chartLabel: 'Пример почасового шанса на 24 часа',
  },
  zh: {
    title: '什么时候机会更高？',
    subtitle: '未来 24 小时逐小时图表的设计示例',
    demo: '教学示例 · 并非预报',
    comparison: '此示例中',
    low: '22:00 · 20%',
    high: '00:00–02:00 · 60%',
    timezone: '莫斯科时间',
    nextDay: '次日',
    daylight: '天亮',
    selected: '所选时段',
    hint: '横向滑动查看其他时段，点击柱形查看该小时的数值。',
    note: '百分比仅作设计示意，与所选城市或当前天气无关。接入并验证全天预测模型后，才能显示实际数值。',
    chartLabel: '24 小时逐小时机会示意图',
  },
} as const;

export function HourlyPreview({ language }: { language: Language }) {
  const [selectedIndex, setSelectedIndex] = useState(4);
  const t = copy[language];
  const selected = SAMPLE_HOURS[selectedIndex];

  return (
    <section className="ap-hourly-card" aria-labelledby="ap-hourly-title">
      <div className="ap-hourly-heading">
        <div>
          <h2 id="ap-hourly-title"><Clock3 size={19} aria-hidden="true" />{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
        <span className="ap-hourly-demo">{t.demo}</span>
      </div>

      <div className="ap-hourly-comparison" aria-label={`${t.comparison}: ${t.low}; ${t.high}`}>
        <span className="ap-hourly-comparison-label">{t.comparison}</span>
        <strong className="ap-hourly-low">{t.low}</strong>
        <span className="ap-hourly-arrow" aria-hidden="true">→</span>
        <strong className="ap-hourly-high">{t.high}</strong>
      </div>

      <div className="ap-hourly-scroll">
        <div className="ap-hourly-chart" role="group" aria-label={t.chartLabel}>
          {SAMPLE_HOURS.map(({ hour, chance }, index) => {
            const isPeak = chance !== null && chance >= 50;
            const showValue = index === 2 || (index >= 4 && index <= 6);
            return (
              <button
                className={`ap-hourly-column ${isPeak ? 'is-peak' : ''} ${chance === null ? 'is-daylight' : ''} ${index === 4 ? 'is-next-day' : ''}`}
                type="button"
                key={index}
                data-hour={hour}
                aria-pressed={selectedIndex === index}
                aria-label={`${hour} — ${chance === null ? t.daylight : `${chance}%`}; ${t.demo}`}
                onClick={() => setSelectedIndex(index)}
              >
                <span className="ap-hourly-value" aria-hidden="true">{showValue ? `${chance}%` : ''}</span>
                <span className="ap-hourly-track" aria-hidden="true">
                  <span className="ap-hourly-bar" style={{ height: `${chance === null ? 4 : Math.max(7, chance)}%` }} />
                </span>
                <span className="ap-hourly-time" aria-hidden="true">{index % 2 === 0 ? hour : ''}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="ap-hourly-bottom">
        <span className="ap-hourly-selection" aria-live="polite">
          {t.selected}: <strong>{selected.hour} · {selected.chance === null ? t.daylight : `${selected.chance}%`}</strong>
        </span>
        <span>{t.timezone} · 00:00 — {t.nextDay}</span>
      </div>
      <p className="ap-hourly-hint">{t.hint}</p>
      <p className="ap-hourly-note">{t.note}</p>
    </section>
  );
}
