'use client';

import { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';

type PreviewMode = 'phone' | 'desktop';
type PreviewScene = 'live' | 'aurora' | 'day' | 'clouds' | 'snow';

export function PreviewClient() {
  const [mode, setMode] = useState<PreviewMode>('phone');
  const [scene, setScene] = useState<PreviewScene>('live');

  return (
    <main className="ap-preview">
      <header className="ap-preview-header">
        <div className="ap-preview-heading">
          <span className="ap-preview-kicker">Aurora Polaris · просмотр сайта</span>
          <h1>Как сайт выглядит на разных экранах</h1>
        </div>

        <nav className="ap-preview-switch" aria-label="Размер экрана для просмотра">
          <button
            type="button"
            className={mode === 'phone' ? 'is-selected' : ''}
            aria-pressed={mode === 'phone'}
            onClick={() => setMode('phone')}
          >
            <Smartphone aria-hidden="true" size={19} />
            Телефон
          </button>
          <button
            type="button"
            className={mode === 'desktop' ? 'is-selected' : ''}
            aria-pressed={mode === 'desktop'}
            onClick={() => setMode('desktop')}
          >
            <Monitor aria-hidden="true" size={19} />
            Компьютер
          </button>
        </nav>
      </header>

      <div className="ap-preview-hint">
        <span>{mode === 'phone' ? 'Экран телефона · 390 × 800' : 'Широкий экран · от 900 px'}</span>
        <span>Сайт внутри можно нажимать и прокручивать</span>
      </div>

      <nav className="ap-preview-scenes" aria-label="Сценарий неба для просмотра дизайна">
        {([
          ['live', 'Сейчас'],
          ['aurora', 'Ночь · сияние'],
          ['day', 'День'],
          ['clouds', 'Облака'],
          ['snow', 'Снег'],
        ] as const).map(([value, label]) => (
          <button key={value} type="button" className={scene === value ? 'is-selected' : ''} aria-pressed={scene === value} onClick={() => setScene(value)}>{label}</button>
        ))}
        <span>Сценарии — только для просмотра дизайна</span>
      </nav>

      <div className="ap-preview-stage">
        <div className={`ap-preview-frame ap-preview-frame--${mode}`}>
          <iframe key={scene} title="Интерактивный просмотр сайта Aurora Polaris" src={scene === 'live' ? '/' : '/?scene=' + scene} />
        </div>
      </div>
    </main>
  );
}
