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
  const [isJumping, setIsJumping] = useState(false);
  const [isBlockHit, setIsBlockHit] = useState(false);
  const [auroraScore, setAuroraScore] = useState(0);
  const [showAuroraBurst, setShowAuroraBurst] = useState(false);
  const [floatingPoints, setFloatingPoints] = useState<{ id: number; text: string }[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [skierPos, setSkierPos] = useState({ x: 15, y: 20 });
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Load saved score
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aurora_mario_score');
      if (saved) setAuroraScore(parseInt(saved, 10) || 0);
    }
  }, []);

  // Web Audio 8-bit sound generator
  const play8BitSound = (type: 'jump' | 'hit' | 'aurora') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
      osc.type = 'square';

      if (type === 'jump') {
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(550, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'hit') {
        // Classic Mario coin: 988Hz -> 1319Hz
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.51, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'aurora') {
        // Magical aurora sparkle chord
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const chordOsc = ctx.createOscillator();
          const chordGain = ctx.createGain();
          chordOsc.type = 'triangle';
          chordOsc.frequency.setValueAtTime(freq, now + i * 0.06);
          chordGain.gain.setValueAtTime(0.07, now + i * 0.06);
          chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6 + i * 0.06);
          chordOsc.connect(chordGain);
          chordGain.connect(ctx.destination);
          chordOsc.start(now + i * 0.06);
          chordOsc.stop(now + 0.6 + i * 0.06);
        });
      }
    } catch {
      // Audio not supported or blocked by browser policy
    }
  };

  const handleJump = () => {
    if (isJumping) return;

    setIsJumping(true);
    play8BitSound('jump');

    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([20, 30, 40]);
    }

    // Hit the block at apex of jump (after 260ms)
    setTimeout(() => {
      setIsBlockHit(true);
      setShowAuroraBurst(true);
      play8BitSound('hit');

      // Add points
      const nextScore = auroraScore + 1;
      setAuroraScore(nextScore);
      if (typeof window !== 'undefined') {
        localStorage.setItem('aurora_mario_score', nextScore.toString());
      }

      // Floating points bubble
      const pointId = Date.now();
      const phrases = ['✨ +100', '🌟 СИЯЕТ!', '🔥 КУШ!', '🍄 БИНГО!'];
      const chosenText = phrases[nextScore % phrases.length];
      setFloatingPoints((prev) => [...prev, { id: pointId, text: chosenText }]);

      setTimeout(() => {
        setFloatingPoints((prev) => prev.filter((p) => p.id !== pointId));
      }, 1000);

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
        const nextY = prev.y > 75 ? 20 : prev.y + 1.2;
        const nextX = prev.x > 80 ? 15 : prev.x + 1.5;
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
          <span className="hud-val">MARIO-01</span>
        </div>
        <div className="hud-item hud-coins">
          <span className="hud-label">СИЯНИЙ ВЫБИТО</span>
          <span className="hud-val">
            <span className="hud-star-icon">🌟</span>x{auroraScore.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="hud-item hud-world">
          <span className="hud-label">МИР</span>
          <span className="hud-val">
            {city === 'teriberka' ? '1-2 ОКЕАН' : city === 'kirovsk' ? '1-3 ХИБИНЫ' : '1-1 СТОЛИЦА'}
          </span>
        </div>
        <div className="hud-item hud-kp">
          <span className="hud-label">KP-СИЛА</span>
          <span className="hud-val highlight">
            {kpIndex !== null ? kpIndex.toFixed(1) : '3.8'}
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
      <div className="mario-stage" onClick={handleJump} role="button" tabIndex={0} aria-label="Прыгнуть и выбить сияние">
        {/* NORTHERN LIGHTS SKY CANVAS & BURST */}
        <div className={`mario-aurora-sky ${showAuroraBurst ? 'is-active' : ''}`}>
          <div className="aurora-wave wave-1" />
          <div className="aurora-wave wave-2" />
          <div className="aurora-wave wave-3" />
          <div className="pixel-stars" />
        </div>

        {/* CITY SPECIFIC ANIMATED BACKGROUNDS */}
        
        {/* 1. TERIBERKA: Barents Sea + Breaching Whales */}
        {city === 'teriberka' && (
          <div className="bg-anim bg-teriberka">
            {/* Rocky Arctic Coast & Lighthouse */}
            <div className="teriberka-coast" />
            <div className="teriberka-lighthouse">
              <div className="lighthouse-beam" />
            </div>

            {/* Ocean Waves */}
            <div className="ocean-layer ocean-back" />
            
            {/* Breaching Whale */}
            <div className="whale-actor">
              <svg viewBox="0 0 160 100" className="whale-svg" aria-label="Кит выпрыгивает из Баренцева моря">
                {/* Whale Body */}
                <path
                  d="M10,75 C25,45 65,30 110,40 C135,46 150,65 145,75 C135,82 95,85 55,80 C30,78 15,82 10,75 Z"
                  fill="#1e293b"
                />
                {/* Belly texture */}
                <path
                  d="M30,76 C60,78 95,78 130,73 C120,78 85,82 45,80 Z"
                  fill="#cbd5e1"
                />
                {/* Dorsal Fin */}
                <path d="M92,38 L105,25 L108,39 Z" fill="#0f172a" />
                {/* Flipper */}
                <path d="M60,65 C72,75 80,85 70,88 C62,87 55,75 60,65 Z" fill="#0f172a" />
                {/* Whale Tail */}
                <path d="M12,74 C5,65 0,55 2,52 C8,55 12,65 15,70 C18,65 24,56 29,54 C29,58 24,68 15,75 Z" fill="#1e293b" />
                {/* Eye */}
                <circle cx="130" cy="55" r="2.5" fill="#ffffff" />
                <circle cx="131" cy="55" r="1.2" fill="#000000" />
              </svg>
              {/* Water Spout / Фонтан пара */}
              <div className="whale-spout">
                <span className="spout-drop drop-1" />
                <span className="spout-drop drop-2" />
                <span className="spout-drop drop-3" />
              </div>
            </div>

            <div className="ocean-layer ocean-front" />
          </div>
        )}

        {/* 2. MURMANSK: Kola Bay + Nuclear Icebreaker Lenin + Polar Bear */}
        {city === 'murmansk' && (
          <div className="bg-anim bg-murmansk">
            {/* Distant Kola Hills with Port Cranes */}
            <div className="murmansk-hills" />

            {/* Icebreaker Lenin moving right */}
            <div className="icebreaker-lenin">
              <svg viewBox="0 0 240 90" className="lenin-svg" aria-label="Атомный ледокол Ленин">
                {/* Dark Hull */}
                <path d="M10,50 L45,72 L210,72 L235,55 L215,50 Z" fill="#1e1e24" />
                {/* Red Underbelly waterline */}
                <path d="M45,72 L210,72 L205,78 L55,78 Z" fill="#dc2626" />
                {/* White Superstructure */}
                <rect x="70" y="28" width="85" height="22" fill="#f8fafc" rx="2" />
                <rect x="85" y="14" width="55" height="15" fill="#f1f5f9" rx="1" />
                {/* Bridge Windows */}
                <rect x="90" y="18" width="45" height="5" fill="#0284c7" />
                {/* Radar Mast & Atomic Symbol */}
                <line x1="112" y1="2" x2="112" y2="14" stroke="#fbbf24" strokeWidth="2.5" />
                <circle cx="112" cy="4" r="3" fill="#ef4444" />
                {/* Smokestack / Nuclear Tower */}
                <rect x="145" y="20" width="16" height="15" fill="#e2e8f0" />
                <rect x="145" y="18" width="16" height="3" fill="#dc2626" />
                {/* Portholes */}
                <circle cx="85" cy="40" r="2" fill="#f59e0b" />
                <circle cx="105" cy="40" r="2" fill="#f59e0b" />
                <circle cx="125" cy="40" r="2" fill="#f59e0b" />
                <circle cx="145" cy="40" r="2" fill="#f59e0b" />
                {/* Inscription: ЛЕНИН */}
                <text x="170" y="62" fill="#facc15" fontSize="8" fontWeight="bold" fontFamily="monospace">ЛЕНИН</text>
              </svg>
              {/* Steam / Smoke */}
              <div className="lenin-steam">
                <span className="steam-puff puff-1" />
                <span className="steam-puff puff-2" />
              </div>
            </div>

            {/* Funny Polar Bear on Ice Floe behind Icebreaker */}
            <div className="polar-bear-floe">
              <div className="ice-floe" />
              <svg viewBox="0 0 60 55" className="bear-svg" aria-label="Белый медведь в ушанке">
                {/* Bear Body */}
                <ellipse cx="28" cy="36" rx="16" ry="12" fill="#f8fafc" />
                {/* Bear Head */}
                <circle cx="36" cy="22" r="10" fill="#f8fafc" />
                {/* Snout */}
                <ellipse cx="44" cy="24" rx="5" ry="3.5" fill="#e2e8f0" />
                <circle cx="47" cy="23" r="1.5" fill="#000" />
                {/* Eye */}
                <circle cx="38" cy="20" r="1.5" fill="#000" />
                {/* Waving Paw */}
                <path d="M38,32 C46,26 50,18 46,16 C42,16 38,24 35,30 Z" className="bear-paw" fill="#f8fafc" />
                {/* Ears */}
                <circle cx="30" cy="14" r="3" fill="#f8fafc" />
                {/* Red Ushanka Hat / Шапка-ушанка */}
                <path d="M28,15 C28,10 44,10 44,15 Z" fill="#ef4444" />
                <rect x="26" y="14" width="20" height="3" fill="#fca5a5" />
                <circle cx="36" cy="9" r="2.5" fill="#ffffff" />
                {/* Ear flaps hanging */}
                <rect x="27" y="16" width="3" height="6" fill="#ef4444" />
                <rect x="41" y="16" width="3" height="6" fill="#ef4444" />
              </svg>
            </div>
          </div>
        )}

        {/* 3. KIROVSK: Khibiny Mountains + Downhill Skier */}
        {city === 'kirovsk' && (
          <div className="bg-anim bg-kirovsk">
            {/* Snowy Mountain Peaks */}
            <div className="khibiny-peaks" />
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
              <svg viewBox="0 0 50 50" className="skier-svg" aria-label="Горнолыжник в Хибинах">
                {/* Skis */}
                <line x1="6" y1="44" x2="42" y2="34" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="12" y1="47" x2="48" y2="37" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
                {/* Skier Legs & Jacket */}
                <path d="M22,35 L26,26 L34,22" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" fill="none" />
                <circle cx="34" cy="16" r="5" fill="#f59e0b" />
                {/* Ski Goggles */}
                <rect x="34" y="14" width="5" height="3" fill="#000" rx="1" />
                {/* Ski Poles */}
                <line x1="28" y1="22" x2="16" y2="38" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="32" y1="22" x2="38" y2="42" stroke="#cbd5e1" strokeWidth="1.5" />
              </svg>
              {/* Snow Spray behind Skier */}
              <div className="snow-spray" />
            </div>
          </div>
        )}

        {/* FLOATING RETRO QUESTION BLOCK [ ? ] */}
        <div className={`mario-block-container ${isBlockHit ? 'is-bumped' : ''}`}>
          <div className="retro-block question-block">
            <span className="block-rivet rivet-tl" />
            <span className="block-rivet rivet-tr" />
            <span className="block-rivet rivet-bl" />
            <span className="block-rivet rivet-br" />
            <span className="block-qmark">?</span>
          </div>

          {/* Floating Points & Aurora Flare */}
          {floatingPoints.map((pt) => (
            <div key={pt.id} className="floating-score">
              {pt.text}
            </div>
          ))}
        </div>

        {/* MARIO ARCTIC HUNTER CHARACTER */}
        <div className={`mario-character ${isJumping ? 'is-jumping' : ''}`}>
          <svg viewBox="0 0 44 56" className="mario-svg" aria-label="Марио Охотник за сиянием">
            {/* Mario Ushanka / Cap */}
            <path d="M12,12 C12,5 34,5 34,12 L38,15 L8,15 Z" fill="#dc2626" />
            <rect x="6" y="14" width="34" height="4" fill="#991b1b" />
            <ellipse cx="23" cy="5" rx="3.5" ry="3" fill="#ffffff" />
            {/* Cap ear flaps in Arctic style */}
            <rect x="8" y="17" width="4" height="8" fill="#991b1b" rx="1" />
            <rect x="33" y="17" width="4" height="8" fill="#991b1b" rx="1" />

            {/* Face & Big Nose */}
            <circle cx="23" cy="22" r="8" fill="#fed7aa" />
            <ellipse cx="28" cy="22" rx="4" ry="3" fill="#fdba74" />
            {/* Eye */}
            <ellipse cx="24" cy="19" rx="1.5" ry="2.2" fill="#0f172a" />
            {/* Mario Famous Mustache */}
            <path d="M17,25 C20,22 28,22 34,25 C31,27 24,27 17,25 Z" fill="#451a03" />

            {/* Warm Winter Red Coat */}
            <rect x="12" y="29" width="22" height="16" fill="#dc2626" rx="2" />
            {/* Blue Overalls & Yellow Buttons */}
            <rect x="15" y="34" width="16" height="12" fill="#1d4ed8" />
            <circle cx="17" cy="35" r="1.5" fill="#facc15" />
            <circle cx="29" cy="35" r="1.5" fill="#facc15" />

            {/* Arm & Fist raised in jump */}
            <g className={isJumping ? 'fist-raised' : 'fist-idle'}>
              <rect x="29" y="24" width="7" height="12" fill="#dc2626" rx="2" transform="rotate(-20 29 24)" />
              <circle cx="34" cy="20" r="4.5" fill="#ffffff" />
            </g>

            {/* Warm Winter Boots */}
            <rect x="13" y="46" width="8" height="8" fill="#78350f" rx="2" />
            <rect x="24" y="46" width="8" height="8" fill="#78350f" rx="2" />
          </svg>
        </div>

        {/* 8-bit PIXEL GROUND BLOCKS */}
        <div className="mario-ground">
          <div className="ground-snow-cap" />
          <div className="ground-brick-pattern" />
        </div>
      </div>

      {/* INTERACTIVE TAP BUTTON */}
      <div className="mario-controls">
        <button
          type="button"
          className="mario-action-btn"
          onClick={handleJump}
        >
          <span className="btn-icon">🍄</span>
          <span className="btn-text">ВЫБИТЬ СИЯНИЕ!</span>
          <span className="btn-hint">(ЖМИ НА КНОПКУ ИЛИ ЭКРАН)</span>
        </button>
      </div>
    </div>
  );
}
