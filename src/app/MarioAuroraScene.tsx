'use client';

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { CityId, CITIES } from '@/lib/conditions';

export interface MarioSceneHandle {
  triggerJump: () => void;
}

export interface MarioAuroraSceneProps {
  city: CityId;
  progress: number; // 0, 1, 2, 3
  onTap: (newProgress: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const MarioAuroraScene = forwardRef<MarioSceneHandle, MarioAuroraSceneProps>(function MarioAuroraScene(
  { city, progress, onTap, soundEnabled, onToggleSound },
  ref
) {
  // Bus and character states
  type BusStatus = 'driving_in' | 'parked' | 'driving_out' | 'gone';
  const [busState, setBusState] = useState<BusStatus>('driving_in');
  const [marioOut, setMarioOut] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isBlockHit, setIsBlockHit] = useState(false);
  const [burstActive, setBurstActive] = useState(false);
  const [floatingPoints, setFloatingPoints] = useState<{ id: number; text: string; kind: 'good' | 'info' }[]>([]);
  const [skierPos, setSkierPos] = useState({ x: 15, y: 15 });
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isJumpingRef = useRef(false);

  // Tourist bus arrival whenever city changes (Variant A)
  useEffect(() => {
    setBusState('driving_in');
    setMarioOut(false);
    setBurstActive(false);

    // 1. Bus parks after 0.8s
    const t1 = setTimeout(() => {
      setBusState('parked');
    }, 800);

    // 2. Mario steps out after 1.1s
    const t2 = setTimeout(() => {
      setMarioOut(true);
    }, 1100);

    // 3. Bus drives off into tundra after 1.6s
    const t3 = setTimeout(() => {
      setBusState('driving_out');
    }, 1600);

    // 4. Bus completely vanishes after 2.3s
    const t4 = setTimeout(() => {
      setBusState('gone');
    }, 2300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [city]);

  // Web Audio 8-bit sound generator
  const play8BitSound = (type: 'jump' | 'hit_1' | 'hit_2' | 'hit_win' | 'chime') => {
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
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.14);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'hit_1') {
        // Step 1: Light cloud break chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'hit_2') {
        // Step 2: Bright ascending aurora chord
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, now + idx * 0.05);
          g.gain.setValueAtTime(0.09, now + idx * 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + idx * 0.05);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + idx * 0.05);
          o.stop(now + 0.35 + idx * 0.05);
        });
      } else if (type === 'hit_win') {
        // Step 3: Triumphant victory fanfare (major triad arpeggio)
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'square';
          o.frequency.setValueAtTime(freq, now + idx * 0.06);
          g.gain.setValueAtTime(0.1, now + idx * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.45 + idx * 0.06);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + idx * 0.06);
          o.stop(now + 0.45 + idx * 0.06);
        });
      } else if (type === 'chime') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch {
      // Audio policy restricted
    }
  };

  const handleJump = () => {
    if (isJumpingRef.current || !marioOut) return;

    isJumpingRef.current = true;
    setIsJumping(true);
    play8BitSound('jump');

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(25);
    }

    setTimeout(() => {
      setIsBlockHit(true);

      const nextProg = Math.min(3, progress + 1);
      const pointId = Date.now();

      if (nextProg === 1) {
        play8BitSound('hit_1');
        setFloatingPoints((prev) => [...prev, { id: pointId, text: '☁️ -30% ТУЧ!', kind: 'info' }]);
      } else if (nextProg === 2) {
        play8BitSound('hit_2');
        setFloatingPoints((prev) => [...prev, { id: pointId, text: '✨ ПРОСВЕТ!', kind: 'good' }]);
      } else if (nextProg === 3) {
        setBurstActive(true);
        play8BitSound('hit_win');
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.([40, 30, 80]);
        }
        const winTitle =
          city === 'murmansk'
            ? '✨ МУРМАНСК СИЯЕТ!'
            : city === 'teriberka'
            ? '🐋 ТЕРИБЕРКА СИЯЕТ!'
            : '⛷️ ХИБИНЫ СИЯЮТ!';
        setFloatingPoints((prev) => [...prev, { id: pointId, text: winTitle, kind: 'good' }]);
      } else {
        // Already completed, play fun chime
        play8BitSound('chime');
      }

      onTap(nextProg);

      setTimeout(() => {
        setIsBlockHit(false);
      }, 300);

      setTimeout(() => {
        setFloatingPoints((prev) => prev.filter((p) => p.id !== pointId));
      }, 1600);
    }, 240);

    setTimeout(() => {
      isJumpingRef.current = false;
      setIsJumping(false);
    }, 450);
  };

  useImperativeHandle(ref, () => ({
    triggerJump: handleJump,
  }));

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
    <div className={`mario-game-wrapper world-${city} stage-step-${progress}`}>
      {/* HUD: Clean Progress Dots & Sound Toggle */}
      <div className="mario-hud mario-hud--minimal">
        <div className="quest-step-indicator" aria-label={`Прогресс локации: ${progress} из 3`}>
          <span className="quest-step-label">ОХОТА:</span>
          <div className="quest-step-dots">
            <span className={`quest-dot ${progress >= 1 ? 'is-active' : ''}`} />
            <span className={`quest-dot ${progress >= 2 ? 'is-active' : ''}`} />
            <span className={`quest-dot ${progress >= 3 ? 'is-active' : ''}`} />
          </div>
        </div>

        <button
          type="button"
          className="hud-sound-toggle"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSound();
          }}
          title={soundEnabled ? 'Выключить 8-битный звук' : 'Включить 8-битный звук'}
          aria-label={soundEnabled ? 'Выключить звук' : 'Включить звук'}
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
        aria-label="Нажать, чтобы прыгнуть и разогнать тучи"
      >
        {/* DYNAMIC SKY WITH CLOUD DISSIPATION BASED ON PROGRESS */}
        <div className={`mario-aurora-sky progress-sky-${progress} ${burstActive ? 'burst-active' : ''}`}>
          {/* 1. HERALDIC MURMANSK COAT-OF-ARMS AURORA RAYS */}
          <div
            className="murmansk-heraldic-aurora"
            style={{
              opacity: progress === 0 ? 0 : progress === 1 ? 0.38 : progress === 2 ? 0.72 : 1,
              transform: progress === 0 ? 'translateY(16px)' : progress === 1 ? 'translateY(8px)' : 'translateY(0)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
            }}
          >
            <svg viewBox="0 0 360 115" className="heraldic-aurora-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="murmanskMultiColorRay" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.05" />
                  <stop offset="15%" stopColor="#c026d3" stopOpacity="0.45" />
                  <stop offset="35%" stopColor="#06b6d4" stopOpacity="0.6" />
                  <stop offset="55%" stopColor="#10b981" stopOpacity="0.75" />
                  <stop offset="72%" stopColor="#fde047" stopOpacity="0.8" />
                  <stop offset="90%" stopColor="#f43f5e" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
                </linearGradient>

                <filter id="softAuroraGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <g className="heraldic-rays" filter="url(#softAuroraGlow)">
                <polygon points="35,115 42,115 48,50 28,50" className="h-ray ray-1" fill="url(#murmanskMultiColorRay)" />
                <polygon points="62,115 70,115 78,36 54,36" className="h-ray ray-2" fill="url(#murmanskMultiColorRay)" />
                <polygon points="92,115 100,115 110,24 82,24" className="h-ray ray-3" fill="url(#murmanskMultiColorRay)" />
                <polygon points="122,115 130,115 144,14 114,14" className="h-ray ray-4" fill="url(#murmanskMultiColorRay)" />
                <polygon points="152,115 162,115 178,5 146,5" className="h-ray ray-5" fill="url(#murmanskMultiColorRay)" />
                <polygon points="186,115 196,115 214,5 182,5" className="h-ray ray-6" fill="url(#murmanskMultiColorRay)" />
                <polygon points="218,115 226,115 246,14 216,14" className="h-ray ray-7" fill="url(#murmanskMultiColorRay)" />
                <polygon points="248,115 256,115 274,24 246,24" className="h-ray ray-8" fill="url(#murmanskMultiColorRay)" />
                <polygon points="278,115 286,115 302,36 278,36" className="h-ray ray-9" fill="url(#murmanskMultiColorRay)" />
                <polygon points="306,115 314,115 326,50 306,50" className="h-ray ray-10" fill="url(#murmanskMultiColorRay)" />
              </g>
            </svg>
          </div>

          {/* 2. Ambient Waves */}
          <div
            className="aurora-waves-layer"
            style={{
              opacity: progress === 0 ? 0 : progress === 1 ? 0.3 : progress === 2 ? 0.65 : 1,
              transition: 'opacity 0.6s ease',
            }}
          >
            <div className="aurora-wave wave-1" />
            <div className="aurora-wave wave-2" />
            <div className="aurora-wave wave-3" />
          </div>

          {/* 3. Pixel Stars */}
          <div
            className="pixel-stars"
            style={{
              opacity: progress === 0 ? 0 : progress === 1 ? 0.25 : progress === 2 ? 0.65 : 1,
              transition: 'opacity 0.6s ease',
            }}
          />

          {/* 4. QUEST CLOUD CURTAIN: Heavy clouds parting horizontally with each tap */}
          <div className={`quest-cloud-curtain curtain-step-${progress}`}>
            <div className="curtain-cloud cloud-far-left" />
            <div className="curtain-cloud cloud-far-right" />
            <div className="curtain-cloud cloud-center" />
            <div className="curtain-cloud cloud-center-low" />
            <div className="curtain-fog-overlay" />
          </div>
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

            <div className="polar-bear-floe">
              <div className="ice-floe" />
              <svg viewBox="0 0 74 65" className="bear-svg" aria-label="Белый северный медведь в ушанке машет лапой">
                <ellipse cx="36" cy="42" rx="19" ry="14" fill="#f1f5f9" />
                <ellipse cx="34" cy="40" rx="17" ry="12" fill="#ffffff" />
                <rect x="18" y="48" width="10" height="9" rx="4" fill="#e2e8f0" />
                <rect x="42" y="48" width="10" height="9" rx="4" fill="#e2e8f0" />
                <circle cx="48" cy="25" r="12" fill="#ffffff" />
                <ellipse cx="58" cy="27" rx="6.5" ry="4.5" fill="#f8fafc" />
                <ellipse cx="62" cy="26" rx="2.5" ry="2" fill="#0f172a" />
                <circle cx="50" cy="22" r="2" fill="#0f172a" />
                <circle cx="50.6" cy="21.4" r="0.7" fill="#ffffff" />
                <circle cx="39" cy="15" r="3.5" fill="#ffffff" />
                <circle cx="39" cy="15" r="2" fill="#fca5a5" />

                <g className="bear-waving-arm">
                  <path d="M46,35 C56,26 64,16 60,12 C55,10 49,20 44,28 Z" fill="#ffffff" />
                  <circle cx="60" cy="12" r="1.5" fill="#334155" />
                  <circle cx="57" cy="11" r="1.5" fill="#334155" />
                </g>

                <path d="M38,16 C38,9 57,9 57,16 Z" fill="#dc2626" />
                <rect x="36" y="15" width="23" height="4" fill="#991b1b" rx="1" />
                <circle cx="47" cy="13" r="2.5" fill="#facc15" />
                <rect x="38" y="18" width="4" height="8" fill="#dc2626" rx="1" />
                <rect x="52" y="18" width="4" height="8" fill="#dc2626" rx="1" />
              </svg>
            </div>
          </div>
        )}

        {/* 3. KIROVSK: Brilliant White Snowy Khibiny Peaks + Skier */}
        {city === 'kirovsk' && (
          <div className="bg-anim bg-kirovsk">
            <div className="khibiny-range-back" />
            <div className="khibiny-range-front">
              <div className="mountain-pines" />
            </div>

            <div className="ski-lift-cable">
              <div className="ski-cabin cabin-1" />
              <div className="ski-cabin cabin-2" />
            </div>

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

        {/* FLOATING QUESTION BLOCK: ? on steps 0, 1, 2, becomes 🌟 on victory (step 3) */}
        <div className={`mario-block-container ${isBlockHit ? 'is-bumped' : ''}`}>
          <div className={`retro-block question-block ${progress === 3 ? 'is-victory-star-block' : ''}`}>
            <span className="block-rivet rivet-tl" />
            <span className="block-rivet rivet-tr" />
            <span className="block-rivet rivet-bl" />
            <span className="block-rivet rivet-br" />
            <span className="block-qmark">{progress === 3 ? '🌟' : '?'}</span>
          </div>

          {/* Floating Points / Badges */}
          {floatingPoints.map((pt) => (
            <div key={pt.id} className={`floating-score score-${pt.kind}`}>
              {pt.text}
            </div>
          ))}
        </div>

        {/* TOURIST BUS: CLEAN WHITE MERCEDES SPRINTER */}
        {busState !== 'gone' && (
          <div className={`tourist-sprinter ${busState}`}>
            <svg viewBox="0 0 160 80" className="sprinter-svg" aria-label="Туристический микроавтобус Mercedes Sprinter">
              <path
                d="M 16,56 L 16,34 C 16,30 20,24 28,24 L 118,24 C 126,24 136,27 144,36 L 152,47 C 154,50 154,53 154,56 Z"
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />
              <rect x="24" y="28" width="22" height="15" rx="3" fill="#0f172a" />
              <rect x="50" y="28" width="26" height="15" rx="3" fill="#0f172a" />
              <rect x="80" y="28" width="26" height="15" rx="3" fill="#0f172a" />
              <path d="M 110,28 L 138,28 C 142,28 147,33 149,38 L 149,43 L 110,43 Z" fill="#0284c7" />

              <rect x="14" y="54" width="142" height="13" fill="#f1f5f9" />
              <rect x="14" y="62" width="142" height="6" fill="#334155" />

              <rect x="150" y="52" width="5" height="5" rx="1" fill="#facc15" />
              <rect x="14" y="52" width="4" height="6" rx="1" fill="#ef4444" />

              <circle cx="151" cy="49" r="2.5" fill="#e2e8f0" stroke="#475569" strokeWidth="0.8" />

              <g className={`wheel-unit ${busState.includes('driving') ? 'is-spinning' : ''}`}>
                <circle cx="34" cy="66" r="11" fill="#0f172a" />
                <circle cx="34" cy="66" r="7.5" fill="#334155" />
                <line x1="34" y1="58.5" x2="34" y2="73.5" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="26.5" y1="66" x2="41.5" y2="66" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="34" cy="66" r="3" fill="#ffffff" />
              </g>

              <g className={`wheel-unit ${busState.includes('driving') ? 'is-spinning' : ''}`}>
                <circle cx="124" cy="66" r="11" fill="#0f172a" />
                <circle cx="124" cy="66" r="7.5" fill="#334155" />
                <line x1="124" y1="58.5" x2="124" y2="73.5" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="116.5" y1="66" x2="131.5" y2="66" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="124" cy="66" r="3" fill="#ffffff" />
              </g>
            </svg>
          </div>
        )}

        {/* MARIO ARCTIC HUNTER */}
        <div
          className={`mario-character ${isJumping ? 'is-jumping' : ''} ${
            marioOut ? 'is-outside-bus' : 'is-inside-bus'
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

        {/* 8-bit GROUND */}
        <div className="mario-ground">
          <div className="ground-snow-cap" />
          <div className="ground-road-stripes" />
          <div className="ground-brick-pattern" />
        </div>
      </div>
    </div>
  );
});
