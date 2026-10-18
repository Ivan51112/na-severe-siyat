'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CityId } from '@/lib/conditions';

interface MarioAuroraSceneProps {
  city: CityId;
  cloudCover: number | null;
  signal: 'green' | 'yellow' | 'red' | 'unknown' | null;
  auroraChance: number | null;
  kpIndex: number | null;
  onHit?: () => void;
}

export function MarioAuroraScene({
  city,
  cloudCover,
  signal,
  auroraChance,
  kpIndex,
  onHit,
}: MarioAuroraSceneProps) {
  // Bus and character states
  const [busState, setBusState] = useState<'driving' | 'parked' | 'ready'>('ready');
  const [isJumping, setIsJumping] = useState(false);
  const [isBlockHit, setIsBlockHit] = useState(false);
  const [auroraScore, setAuroraScore] = useState(0);
  const [auroraState, setAuroraState] = useState<'idle' | 'blazing' | 'clouded'>('idle');
  const [floatingPoints, setFloatingPoints] = useState<{ id: number; text: string; kind: 'good' | 'bad' }[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [skierPos, setSkierPos] = useState({ x: 15, y: 15 });
  const audioCtxRef = useRef<AudioContext | null>(null);

  const isFavorable = signal === 'green' || (cloudCover !== null && cloudCover < 50);

  // Load saved score
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aurora_mario_score');
      if (saved) setAuroraScore(parseInt(saved, 10) || 0);
    }
  }, []);

  // Whenever city changes, trigger the tourist bus arrival!
  useEffect(() => {
    setBusState('driving');
    setAuroraState('idle');

    // Bus drives in, parks after 1.1s
    const t1 = setTimeout(() => {
      setBusState('parked');
    }, 1100);

    // Mario steps out after 1.6s
    const t2 = setTimeout(() => {
      setBusState('ready');
    }, 1700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [city]);

  // Web Audio 8-bit sound generator
  const play8BitSound = (type: 'jump' | 'hit_win' | 'hit_miss' | 'bus') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'jump') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(550, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'hit_win') {
        // Classic triumphant coin & powerup chord
        osc.type = 'square';
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.51, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);

        // Aurora sparkle arpeggio
        [659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
          const chordOsc = ctx.createOscillator();
          const chordGain = ctx.createGain();
          chordOsc.type = 'triangle';
          chordOsc.frequency.setValueAtTime(freq, now + 0.1 + idx * 0.07);
          chordGain.gain.setValueAtTime(0.08, now + 0.1 + idx * 0.07);
          chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6 + idx * 0.07);
          chordOsc.connect(chordGain);
          chordGain.connect(ctx.destination);
          chordOsc.start(now + 0.1 + idx * 0.07);
          chordOsc.stop(now + 0.6 + idx * 0.07);
        });
      } else if (type === 'hit_miss') {
        // Funny 8-bit miss buzz (descending sad trombone)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(130, now + 0.3);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
      }
    } catch {
      // Audio not permitted by browser
    }
  };

  const handleJump = () => {
    if (isJumping || busState !== 'ready') return;

    setIsJumping(true);
    play8BitSound('jump');

    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([25, 30, 45]);
    }

    // Hit the block at apex of jump
    setTimeout(() => {
      setIsBlockHit(true);

      if (isFavorable) {
        // SUCCESS: Aurora lights up bright!
        setAuroraState('blazing');
        play8BitSound('hit_win');

        const nextScore = auroraScore + 1;
        setAuroraScore(nextScore);
        if (typeof window !== 'undefined') {
          localStorage.setItem('aurora_mario_score', nextScore.toString());
        }

        const pointId = Date.now();
        const winPhrases = ['🌟 СИЯЕТ!', '🔥 КУШ!', '✨ ДЖЕКПОТ!', '🚀 ВЫЕЗЖАЕМ!'];
        const chosen = winPhrases[nextScore % winPhrases.length];
        setFloatingPoints((prev) => [...prev, { id: pointId, text: chosen, kind: 'good' }]);

        setTimeout(() => {
          setFloatingPoints((prev) => prev.filter((p) => p.id !== pointId));
        }, 1200);
      } else {
        // CLOUDY / BAD FORECAST: Aurora dimmed behind clouds!
        setAuroraState('clouded');
        play8BitSound('hit_miss');

        const pointId = Date.now();
        const missPhrases = ['☁️ ТУЧИ!', '🌫️ ПЕРЕЖДЕМ!', '❄️ СНЕГОПАД!', '🔍 ИЩИ ПРОСВЕТ'];
        const chosen = missPhrases[Math.floor(Math.random() * missPhrases.length)];
        setFloatingPoints((prev) => [...prev, { id: pointId, text: chosen, kind: 'bad' }]);

        setTimeout(() => {
          setFloatingPoints((prev) => prev.filter((p) => p.id !== pointId));
        }, 1200);
      }

      if (onHit) onHit();

      // Reset block bounce
      setTimeout(() => {
        setIsBlockHit(false);
      }, 180);
    }, 250);

    // Land back
    setTimeout(() => {
      setIsJumping(false);
    }, 550);
  };

  // Animate skier in Kirovsk
  useEffect(() => {
    if (city !== 'kirovsk') return;
    const interval = setInterval(() => {
      setSkierPos((prev) => {
        const nextY = prev.y > 75 ? 12 : prev.y + 1.4;
        const nextX = prev.x > 82 ? 12 : prev.x + 1.6;
        return { x: nextX, y: nextY };
      });
    }, 80);
    return () => clearInterval(interval);
  }, [city]);

  return (
    <div className={`mario-game-wrapper world-${city}`}>
      {/* 8-bit ARCADE HUD BAR */}
      <div className="mario-hud">
        <div className="hud-item hud-hunter">
          <span className="hud-label">ОХОТНИК</span>
          <span className="hud-val">MARIO-SPRINTER</span>
        </div>
        <div className="hud-item hud-coins">
          <span className="hud-label">СИЯНИЙ ВЫБИТО</span>
          <span className="hud-val">
            <span className="hud-star-icon">🌟</span>x{auroraScore.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="hud-item hud-world">
          <span className="hud-label">РЕЙД</span>
          <span className="hud-val">
            {city === 'teriberka' ? 'ОКЕАН 1-2' : city === 'kirovsk' ? 'ХИБИНЫ 1-3' : 'МУРМАНСК 1-1'}
          </span>
        </div>
        <div className="hud-item hud-kp">
          <span className="hud-label">ПРОГНОЗ</span>
          <span className={`hud-val ${isFavorable ? 'highlight-win' : 'highlight-cloud'}`}>
            {isFavorable ? '🟢 СИЯЕТ' : '☁️ ТУЧИ'}
          </span>
        </div>
        <button
          type="button"
          className="hud-sound-toggle"
          onClick={() => setSoundEnabled(!soundEnabled)}
          title="Включить / выключить 8-битный звук"
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>

      {/* GAME STAGE VIEW */}
      <div
        className="mario-stage"
        onClick={handleJump}
        role="button"
        tabIndex={0}
        aria-label="Прыгнуть и выбить прогноз сияния"
      >
        {/* DYNAMIC AURORA SKY: Reacts to forecast! */}
        <div className={`mario-aurora-sky aurora-mode-${auroraState}`}>
          <div className="aurora-wave wave-1" />
          <div className="aurora-wave wave-2" />
          <div className="aurora-wave wave-3" />
          <div className="pixel-stars" />

          {/* If clouds cover the sky on bad forecast hit */}
          {auroraState === 'clouded' && (
            <div className="cloud-storm-overlay">
              <div className="storm-cloud cloud-a" />
              <div className="storm-cloud cloud-b" />
              <div className="storm-cloud cloud-c" />
              <div className="pixel-snowfall" />
            </div>
          )}
        </div>

        {/* CITY SPECIFIC ANIMATED BACKGROUNDS */}

        {/* 1. TERIBERKA: Ocean + Breaching Whales */}
        {city === 'teriberka' && (
          <div className="bg-anim bg-teriberka">
            <div className="teriberka-coast" />
            <div className="teriberka-lighthouse">
              <div className="lighthouse-beam" />
            </div>
            <div className="ocean-layer ocean-back" />

            {/* Breaching Whale */}
            <div className="whale-actor">
              <svg viewBox="0 0 160 100" className="whale-svg" aria-label="Кит в Баренцевом море">
                <path
                  d="M10,75 C25,45 65,30 110,40 C135,46 150,65 145,75 C135,82 95,85 55,80 C30,78 15,82 10,75 Z"
                  fill="#1e293b"
                />
                <path d="M30,76 C60,78 95,78 130,73 C120,78 85,82 45,80 Z" fill="#cbd5e1" />
                <path d="M92,38 L105,25 L108,39 Z" fill="#0f172a" />
                <path d="M60,65 C72,75 80,85 70,88 C62,87 55,75 60,65 Z" fill="#0f172a" />
                <path
                  d="M12,74 C5,65 0,55 2,52 C8,55 12,65 15,70 C18,65 24,56 29,54 C29,58 24,68 15,75 Z"
                  fill="#1e293b"
                />
                <circle cx="130" cy="55" r="2.5" fill="#ffffff" />
                <circle cx="131" cy="55" r="1.2" fill="#000000" />
              </svg>
              <div className="whale-spout">
                <span className="spout-drop drop-1" />
                <span className="spout-drop drop-2" />
                <span className="spout-drop drop-3" />
              </div>
            </div>

            <div className="ocean-layer ocean-front" />
          </div>
        )}

        {/* 2. MURMANSK: Kola Bay + Nuclear Icebreaker Lenin + Detailed White Polar Bear */}
        {city === 'murmansk' && (
          <div className="bg-anim bg-murmansk">
            <div className="murmansk-hills" />

            {/* Icebreaker Lenin */}
            <div className="icebreaker-lenin">
              <svg viewBox="0 0 240 90" className="lenin-svg" aria-label="Атомный ледокол Ленин">
                <path d="M10,50 L45,72 L210,72 L235,55 L215,50 Z" fill="#1e1e24" />
                <path d="M45,72 L210,72 L205,78 L55,78 Z" fill="#dc2626" />
                <rect x="70" y="28" width="85" height="22" fill="#f8fafc" rx="2" />
                <rect x="85" y="14" width="55" height="15" fill="#f1f5f9" rx="1" />
                <rect x="90" y="18" width="45" height="5" fill="#0284c7" />
                <line x1="112" y1="2" x2="112" y2="14" stroke="#fbbf24" strokeWidth="2.5" />
                <circle cx="112" cy="4" r="3" fill="#ef4444" />
                <rect x="145" y="20" width="16" height="15" fill="#e2e8f0" />
                <rect x="145" y="18" width="16" height="3" fill="#dc2626" />
                <circle cx="85" cy="40" r="2" fill="#f59e0b" />
                <circle cx="105" cy="40" r="2" fill="#f59e0b" />
                <circle cx="125" cy="40" r="2" fill="#f59e0b" />
                <circle cx="145" cy="40" r="2" fill="#f59e0b" />
                <text x="170" y="62" fill="#facc15" fontSize="8" fontWeight="bold" fontFamily="monospace">
                  ЛЕНИН
                </text>
              </svg>
              <div className="lenin-steam">
                <span className="steam-puff puff-1" />
                <span className="steam-puff puff-2" />
              </div>
            </div>

            {/* UPGRADED: High-Detail Recognizable Polar Bear standing on an ice floe */}
            <div className="polar-bear-floe">
              <div className="ice-floe" />
              <svg viewBox="0 0 74 65" className="bear-svg" aria-label="Белый северный медведь в ушанке машет лапой">
                {/* Bear Thick Body with shaded fur */}
                <ellipse cx="36" cy="42" rx="19" ry="14" fill="#f1f5f9" />
                <ellipse cx="34" cy="40" rx="17" ry="12" fill="#ffffff" />
                {/* Hind legs */}
                <rect x="18" y="48" width="10" height="9" rx="4" fill="#e2e8f0" />
                <rect x="42" y="48" width="10" height="9" rx="4" fill="#e2e8f0" />

                {/* Bear Head */}
                <circle cx="48" cy="25" r="12" fill="#ffffff" />
                {/* Snout with black nose */}
                <ellipse cx="58" cy="27" rx="6.5" ry="4.5" fill="#f8fafc" />
                <ellipse cx="62" cy="26" rx="2.5" ry="2" fill="#0f172a" />
                {/* Cute black eye */}
                <circle cx="50" cy="22" r="2" fill="#0f172a" />
                <circle cx="50.6" cy="21.4" r="0.7" fill="#ffffff" />
                {/* Bear Ears */}
                <circle cx="39" cy="15" r="3.5" fill="#ffffff" />
                <circle cx="39" cy="15" r="2" fill="#fca5a5" />

                {/* Big Fluffy Waving Paw */}
                <g className="bear-waving-arm">
                  <path d="M46,35 C56,26 64,16 60,12 C55,10 49,20 44,28 Z" fill="#ffffff" />
                  {/* Black claws / paw pads */}
                  <circle cx="60" cy="12" r="1.5" fill="#334155" />
                  <circle cx="57" cy="11" r="1.5" fill="#334155" />
                </g>

                {/* Red Russian Ushanka Hat with badge */}
                <path d="M38,16 C38,9 57,9 57,16 Z" fill="#dc2626" />
                <rect x="36" y="15" width="23" height="4" fill="#991b1b" rx="1" />
                <circle cx="47" cy="13" r="2.5" fill="#facc15" />
                {/* Ear flaps hanging */}
                <rect x="38" y="18" width="4" height="8" fill="#dc2626" rx="1" />
                <rect x="52" y="18" width="4" height="8" fill="#dc2626" rx="1" />
              </svg>
            </div>
          </div>
        )}

        {/* 3. KIROVSK: UPGRADED High-Detail Khibiny Mountain Peaks with Snow & Skier */}
        {city === 'kirovsk' && (
          <div className="bg-anim bg-kirovsk">
            {/* Multi-layered snowy mountain ridge */}
            <div className="khibiny-range-back" />
            <div className="khibiny-range-front">
              {/* Pine trees along mountain base */}
              <div className="mountain-pines" />
            </div>

            {/* Big Wood Ski Lift */}
            <div className="ski-lift-cable">
              <div className="ski-cabin cabin-1" />
              <div className="ski-cabin cabin-2" />
            </div>

            {/* Skier carving down slope */}
            <div
              className="skier-actor"
              style={{
                left: `${skierPos.x}%`,
                top: `${skierPos.y}%`,
              }}
            >
              <svg viewBox="0 0 50 50" className="skier-svg" aria-label="Горнолыжник на склоне Хибин">
                <line x1="6" y1="44" x2="42" y2="34" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="12" y1="47" x2="48" y2="37" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M22,35 L26,26 L34,22" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" fill="none" />
                <circle cx="34" cy="16" r="5" fill="#f59e0b" />
                <rect x="34" y="14" width="5" height="3" fill="#000" rx="1" />
                <line x1="28" y1="22" x2="16" y2="38" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="32" y1="22" x2="38" y2="42" stroke="#cbd5e1" strokeWidth="1.5" />
              </svg>
              <div className="snow-spray" />
            </div>
          </div>
        )}

        {/* FLOATING RETRO QUESTION BLOCK [ ? ] */}
        <div className={`mario-block-container ${isBlockHit ? 'is-bumped' : ''}`}>
          <div className={`retro-block question-block ${auroraState === 'clouded' ? 'is-cloud-hit' : ''}`}>
            <span className="block-rivet rivet-tl" />
            <span className="block-rivet rivet-tr" />
            <span className="block-rivet rivet-bl" />
            <span className="block-rivet rivet-br" />
            <span className="block-qmark">{auroraState === 'clouded' ? '☁' : '?'}</span>
          </div>

          {/* Floating Points / Badges */}
          {floatingPoints.map((pt) => (
            <div key={pt.id} className={`floating-score score-${pt.kind}`}>
              {pt.text}
            </div>
          ))}
        </div>

        {/* TOURIST BUS: MERCEDES SPRINTER ARRIVES IN TUNDRA */}
        <div className={`tourist-sprinter ${busState}`}>
          <svg viewBox="0 0 160 80" className="sprinter-svg" aria-label="Туристический микроавтобус Mercedes Sprinter">
            {/* Front Headlights Beam illuminating tundra */}
            <polygon points="150,56 220,40 220,75 150,66" fill="url(#sprinterLightGlow)" opacity="0.6" />
            <defs>
              <linearGradient id="sprinterLightGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Van Body (White / Silver Sprinter) */}
            <path
              d="M10,24 L110,24 C120,24 135,32 142,44 L152,50 C155,52 155,56 155,62 L152,66 L10,66 C8,66 6,64 6,60 L6,28 C6,25 8,24 10,24 Z"
              fill="#f8fafc"
              stroke="#0f172a"
              strokeWidth="2.5"
            />
            {/* Dark Tinted Side & Front Windows */}
            <rect x="16" y="28" width="22" height="14" fill="#0f172a" rx="1.5" />
            <rect x="42" y="28" width="22" height="14" fill="#0f172a" rx="1.5" />
            <rect x="68" y="28" width="22" height="14" fill="#0f172a" rx="1.5" />
            <path d="M94,28 L114,28 C122,28 132,36 136,44 L94,44 Z" fill="#0f172a" />

            {/* Tourist Expedition Logo Stripe on Side */}
            <rect x="12" y="46" width="130" height="5" fill="#0284c7" />
            <text x="20" y="50" fill="#facc15" fontSize="3.5" fontWeight="bold" fontFamily="sans-serif">
              ✨ ТУР «НА СЕВЕРЕ — СИЯТЬ»
            </text>

            {/* Mercedes Chrome Grille & Star */}
            <rect x="146" y="53" width="7" height="8" fill="#1e293b" rx="1" />
            <circle cx="149.5" cy="57" r="2.5" fill="#cbd5e1" />

            {/* Glowing Headlight */}
            <rect x="148" y="51" width="5" height="3" fill="#fef08a" rx="1" />

            {/* Wheels with mudguards */}
            <circle cx="34" cy="66" r="10" fill="#0f172a" />
            <circle cx="34" cy="66" r="5" fill="#94a3b8" />
            <circle cx="124" cy="66" r="10" fill="#0f172a" />
            <circle cx="124" cy="66" r="5" fill="#94a3b8" />

            {/* Expedition Roof Rack with luggage/skis */}
            <rect x="20" y="20" width="75" height="3" fill="#334155" />
            <rect x="25" y="16" width="22" height="4" fill="#dc2626" rx="1" />
            <rect x="52" y="16" width="26" height="4" fill="#059669" rx="1" />
          </svg>
        </div>

        {/* MARIO ARCTIC HUNTER: Steps out of Sprinter & Jumps */}
        <div
          className={`mario-character ${isJumping ? 'is-jumping' : ''} ${
            busState === 'driving' ? 'is-inside-bus' : 'is-outside-bus'
          }`}
        >
          <svg viewBox="0 0 44 56" className="mario-svg" aria-label="Марио Охотник за сиянием">
            <path d="M12,12 C12,5 34,5 34,12 L38,15 L8,15 Z" fill="#dc2626" />
            <rect x="6" y="14" width="34" height="4" fill="#991b1b" />
            <ellipse cx="23" cy="5" rx="3.5" ry="3" fill="#ffffff" />
            <rect x="8" y="17" width="4" height="8" fill="#991b1b" rx="1" />
            <rect x="33" y="17" width="4" height="8" fill="#991b1b" rx="1" />

            <circle cx="23" cy="22" r="8" fill="#fed7aa" />
            <ellipse cx="28" cy="22" rx="4" ry="3" fill="#fdba74" />
            <ellipse cx="24" cy="19" rx="1.5" ry="2.2" fill="#0f172a" />
            <path d="M17,25 C20,22 28,22 34,25 C31,27 24,27 17,25 Z" fill="#451a03" />

            <rect x="12" y="29" width="22" height="16" fill="#dc2626" rx="2" />
            <rect x="15" y="34" width="16" height="12" fill="#1d4ed8" />
            <circle cx="17" cy="35" r="1.5" fill="#facc15" />
            <circle cx="29" cy="35" r="1.5" fill="#facc15" />

            <g className={isJumping ? 'fist-raised' : 'fist-idle'}>
              <rect x="29" y="24" width="7" height="12" fill="#dc2626" rx="2" transform="rotate(-20 29 24)" />
              <circle cx="34" cy="20" r="4.5" fill="#ffffff" />
            </g>

            <rect x="13" y="46" width="8" height="8" fill="#78350f" rx="2" />
            <rect x="24" y="46" width="8" height="8" fill="#78350f" rx="2" />
          </svg>
        </div>

        {/* 8-bit PIXEL GROUND BLOCKS */}
        <div className="mario-ground">
          <div className="ground-snow-cap" />
          <div className="ground-road-stripes" />
          <div className="ground-brick-pattern" />
        </div>
      </div>

      {/* INTERACTIVE TAP BUTTON */}
      <div className="mario-controls">
        <button
          type="button"
          className={`mario-action-btn ${isFavorable ? 'btn-favorable' : 'btn-check'}`}
          onClick={handleJump}
        >
          <span className="btn-icon">🍄</span>
          <span className="btn-text">
            {auroraState === 'blazing'
              ? '✨ СИЯНИЕ ВЫБИТО! ЖМИ ЕЩЁ!'
              : auroraState === 'clouded'
              ? '☁️ ТУЧИ! ПОПРОБУЙ ВЫБИТЬ СНОВА'
              : 'ВЫБИТЬ СИЯНИЕ ИЗ БЛОКА!'}
          </span>
          <span className="btn-hint">(ЖМИ НА КНОПКУ ИЛИ ЭКРАН)</span>
        </button>
      </div>
    </div>
  );
}
