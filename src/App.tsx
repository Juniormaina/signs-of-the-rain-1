import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  StartGame,
  EventBus,
  GamePhase,
  ScoutTelemetry,
  ClueData,
  Difficulty,
  DIFFICULTIES,
  EVT_PHASE_CHANGED,
  EVT_SCOUT_TELEMETRY,
  EVT_CLUE_INSPECTED,
  EVT_WATER_DISCOVERED,
  EVT_FOCUS_ACTIVATED,
  EVT_JOURNAL_TOGGLE,
  EVT_START_GAME,
  EVT_RESET_EXPEDITION,
  EVT_TOGGLE_PAUSE,
  EVT_TOUCH_DIR,
  EVT_TOUCH_OBSERVE,
  EVT_TOUCH_FOCUS,
} from './game/main';

const SIGN_ICONS: Record<string, string> = {
  birds: '🕊️',
  vegetation: '🌿',
  tracks: '🐾',
  mirage: '🌫️',
};

export default function App(): React.JSX.Element {
  const phaserRef = useRef<Phaser.Game | null>(null);

  // Core Game State
  const [phase, setPhase] = useState<GamePhase>('MENU');
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [telemetry, setTelemetry] = useState<ScoutTelemetry>({
    x: 1200,
    y: 900,
    heading: 0,
    hydration: 100,
    timeRemaining: DIFFICULTIES.EASY.timeLimit,
    waterFound: 0,
    totalWater: 3,
    cluesFound: 0,
    totalClues: 9,
    nearbyClue: null,
    nearHomeVillage: true,
    canWin: false,
    difficulty: 'EASY',
    focusRemaining: DIFFICULTIES.EASY.maxFocus,
    maxFocus: DIFFICULTIES.EASY.maxFocus,
    isFocusActive: false,
  });

  const [discoveredClues, setDiscoveredClues] = useState<ClueData[]>([]);
  const [recentCluePopup, setRecentCluePopup] = useState<ClueData | null>(null);
  const [recentWaterPopup, setRecentWaterPopup] = useState<{ sourceId: string; name: string; locationName: string; count: number; total: number } | null>(null);
  const [focusFlash, setFocusFlash] = useState<number | null>(null);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [journalTab, setJournalTab] = useState<'all' | 'birds' | 'vegetation' | 'tracks' | 'mirage'>('all');
  const [isMuted, setIsMuted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Mount Phaser Game
  useLayoutEffect(() => {
    if (!phaserRef.current) {
      phaserRef.current = StartGame('game-container');
    }

    return () => {
      if (phaserRef.current) {
        phaserRef.current.destroy(true);
        phaserRef.current = null;
      }
    };
  }, []);

  // EventBus Subscriptions
  useEffect(() => {
    const handlePhaseChanged = (newPhase: GamePhase) => {
      setPhase(newPhase);
    };

    const handleTelemetry = (data: ScoutTelemetry) => {
      setTelemetry(data);
    };

    const handleClueInspected = (clue: ClueData) => {
      setDiscoveredClues((prev) => {
        if (prev.some((c) => c.id === clue.id)) return prev;
        return [...prev, clue];
      });
      setRecentCluePopup(clue);
    };

    const handleWaterDiscovered = (water: { sourceId: string; name: string; locationName: string; count: number; total: number }) => {
      setRecentWaterPopup(water);
    };

    const handleFocusActivated = (payload: { remaining: number }) => {
      setFocusFlash(payload?.remaining ?? 0);
      window.setTimeout(() => setFocusFlash(null), 2200);
    };

    const handleJournalToggle = (open?: boolean) => {
      setIsJournalOpen((prev) => (typeof open === 'boolean' ? open : !prev));
    };

    // Subscriptions
    EventBus.on(EVT_PHASE_CHANGED, handlePhaseChanged);
    EventBus.on(EVT_SCOUT_TELEMETRY, handleTelemetry);
    EventBus.on(EVT_CLUE_INSPECTED, handleClueInspected);
    EventBus.on(EVT_WATER_DISCOVERED, handleWaterDiscovered);
    EventBus.on(EVT_FOCUS_ACTIVATED, handleFocusActivated);
    EventBus.on(EVT_JOURNAL_TOGGLE, handleJournalToggle);

    return () => {
      EventBus.removeListener(EVT_PHASE_CHANGED, handlePhaseChanged);
      EventBus.removeListener(EVT_SCOUT_TELEMETRY, handleTelemetry);
      EventBus.removeListener(EVT_CLUE_INSPECTED, handleClueInspected);
      EventBus.removeListener(EVT_WATER_DISCOVERED, handleWaterDiscovered);
      EventBus.removeListener(EVT_FOCUS_ACTIVATED, handleFocusActivated);
      EventBus.removeListener(EVT_JOURNAL_TOGGLE, handleJournalToggle);
    };
  }, []);

  // Actions
  const handleStartGame = () => {
    setDiscoveredClues([]);
    setRecentCluePopup(null);
    setRecentWaterPopup(null);
    setIsJournalOpen(false);
    EventBus.emit(EVT_START_GAME, { difficulty });
  };

  const handleResetExpedition = () => {
    setDiscoveredClues([]);
    setRecentCluePopup(null);
    setRecentWaterPopup(null);
    setIsJournalOpen(false);
    EventBus.emit(EVT_RESET_EXPEDITION, { difficulty });
  };

  const handleTogglePause = () => {
    EventBus.emit(EVT_TOGGLE_PAUSE);
  };

  const handleObserve = () => {
    EventBus.emit(EVT_TOUCH_OBSERVE);
  };

  const handleFocus = () => {
    EventBus.emit(EVT_TOUCH_FOCUS);
  };

  const handleTouchDir = (x: number, y: number) => {
    EventBus.emit(EVT_TOUCH_DIR, { x, y });
  };

  const toggleSound = () => {
    if (phaserRef.current) {
      phaserRef.current.sound.mute = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Dual-input restart on end screens (plan §3.6)
  useEffect(() => {
    if (phase !== 'GAMEOVER' && phase !== 'FINISHED') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleResetExpedition();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Helper formatting
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const filteredClues =
    journalTab === 'all'
      ? discoveredClues
      : discoveredClues.filter((c) => (journalTab === 'mirage' ? c.isDecoy : c.signType === journalTab));

  const settings = DIFFICULTIES[difficulty];

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#1c1917', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Phaser Canvas Container */}
      <div id="game-container" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />

      {/* REACT HUD & UI OVERLAYS */}
      <div id="hud" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>
        {/* TOP STATUS BAR (When PLAYING or PAUSED) */}
        {(phase === 'PLAYING' || phase === 'PAUSED') && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              right: 12,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              pointerEvents: 'auto',
            }}
          >
            {/* Left: Scout Stats & Resources */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                backgroundColor: 'rgba(28, 25, 23, 0.88)',
                padding: '8px 14px',
                borderRadius: 12,
                border: '1px solid #78350f',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                color: '#fef3c7',
                alignItems: 'center',
              }}
            >
              {/* Hydration */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#38bdf8">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Hydration</span>
                  <div style={{ width: 64, height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${telemetry.hydration}%`,
                        height: '100%',
                        backgroundColor: telemetry.hydration > 30 ? '#0284c7' : '#ef4444',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ width: 1, height: 24, backgroundColor: '#451a03' }} />

              {/* Water Sources Discovered */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={telemetry.waterFound === 3 ? '#22c55e' : '#38bdf8'}>
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Water Sources</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: telemetry.waterFound === 3 ? '#4ade80' : '#e0f2fe' }}>
                    {telemetry.waterFound} / {telemetry.totalWater}
                  </span>
                </div>
              </div>

              <div style={{ width: 1, height: 24, backgroundColor: '#451a03' }} />

              {/* Clues Inspected */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fbbf24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Signs Decoded</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fef08a' }}>
                    {telemetry.cluesFound} / {telemetry.totalClues}
                  </span>
                </div>
              </div>

              <div style={{ width: 1, height: 24, backgroundColor: '#451a03' }} />

              {/* Focus Charges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={telemetry.focusRemaining > 0 ? '#facc15' : '#57534e'}>
                  <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Focus</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: telemetry.isFocusActive ? '#22d3ee' : telemetry.focusRemaining > 0 ? '#fde68a' : '#78716c' }}>
                    {telemetry.isFocusActive ? 'ACTIVE…' : `${telemetry.focusRemaining} / ${telemetry.maxFocus}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Expedition Timer & Compass */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                backgroundColor: 'rgba(28, 25, 23, 0.88)',
                padding: '8px 16px',
                borderRadius: 12,
                border: `1px solid ${telemetry.isFocusActive ? '#22d3ee' : '#d97706'}`,
                boxShadow: telemetry.isFocusActive ? '0 0 24px rgba(34,211,238,0.5)' : '0 4px 12px rgba(0,0,0,0.5)',
                color: '#fef3c7',
                alignItems: 'center',
                transition: 'border 0.3s ease, box-shadow 0.3s ease',
              }}
            >
              {/* Timer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={telemetry.timeRemaining < 60 ? '#ef4444' : '#f59e0b'}>
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                    Expedition Time · {settings.label}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: telemetry.timeRemaining < 60 ? '#f87171' : '#fef3c7' }}>
                    {formatTime(telemetry.timeRemaining)}
                  </span>
                </div>
              </div>

              {/* Compass Indicator */}
              <div
                title="Breeze & Clue Direction"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#451a03',
                  border: '1px solid #d97706',
                  transform: `rotate(${telemetry.heading}deg)`,
                  transition: 'transform 0.2s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#38bdf8">
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                </svg>
              </div>
            </div>

            {/* Right: Action Buttons (Focus, Journal, Mute, Pause) */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleFocus}
                disabled={telemetry.focusRemaining <= 0 || telemetry.isFocusActive}
                title="Slow time & reveal nearby signs"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: telemetry.focusRemaining > 0 && !telemetry.isFocusActive ? '#ca8a04' : '#44403c',
                  color: '#ffffff',
                  border: '1px solid #facc15',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: telemetry.focusRemaining > 0 && !telemetry.isFocusActive ? 'pointer' : 'not-allowed',
                  opacity: telemetry.focusRemaining > 0 || telemetry.isFocusActive ? 1 : 0.55,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                </svg>
                <span>Focus [F]</span>
              </button>

              <button
                onClick={() => setIsJournalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#b45309',
                  color: '#ffffff',
                  border: '1px solid #d97706',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
                </svg>
                <span>Journal [J]</span>
              </button>

              <button
                onClick={toggleSound}
                style={{
                  backgroundColor: 'rgba(28, 25, 23, 0.88)',
                  color: isMuted ? '#ef4444' : '#38bdf8',
                  border: '1px solid #78350f',
                  borderRadius: 10,
                  padding: '8px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {isMuted ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>

              <button
                onClick={handleTogglePause}
                style={{
                  backgroundColor: 'rgba(28, 25, 23, 0.88)',
                  color: '#fef3c7',
                  border: '1px solid #78350f',
                  borderRadius: 10,
                  padding: '8px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* FOCUS ACTIVATION FLASH */}
        {focusFlash !== null && phase === 'PLAYING' && (
          <div
            style={{
              position: 'absolute',
              top: 90,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(8, 51, 68, 0.92)',
              border: '2px solid #22d3ee',
              borderRadius: 12,
              padding: '8px 18px',
              color: '#a5f3fc',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              boxShadow: '0 0 30px rgba(34, 211, 238, 0.5)',
              pointerEvents: 'none',
            }}
          >
            Focus Attuned — {focusFlash} charge{focusFlash === 1 ? '' : 's'} left
          </div>
        )}

        {/* ACTIVE NEARBY CLUE / INTERACTION BANNER */}
        {phase === 'PLAYING' && telemetry.nearbyClue && !telemetry.nearbyClue.discovered && (
          <div
            style={{
              position: 'absolute',
              bottom: 110,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(15, 23, 42, 0.94)',
              border: '2px solid #0284c7',
              borderRadius: 14,
              padding: '12px 20px',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              pointerEvents: 'auto',
              maxWidth: 420,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700 }}>
                  Environmental Sign Detected
                </span>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                {telemetry.nearbyClue.title}
              </span>
            </div>
            <button
              onClick={handleObserve}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.6)',
              }}
            >
              Observe [E]
            </button>
          </div>
        )}

        {/* RETURN TO VILLAGE OBJECTIVE BANNER (When all 3 water sources found) */}
        {phase === 'PLAYING' && telemetry.waterFound === 3 && (
          <div
            style={{
              position: 'absolute',
              bottom: 110,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(20, 83, 45, 0.95)',
              border: '2px solid #22c55e',
              borderRadius: 14,
              padding: '12px 20px',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(34, 197, 94, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              pointerEvents: 'auto',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#86efac', fontWeight: 700 }}>
                All 3 Water Sources Verified!
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f0fdf4' }}>
                Return to the Home Village Beacon to guide the community!
              </span>
            </div>
            {telemetry.nearHomeVillage && (
              <button
                onClick={handleObserve}
                style={{
                  backgroundColor: '#22c55e',
                  color: '#052e16',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Finish Expedition [E]
              </button>
            )}
          </div>
        )}

        {/* POPUP NOTIFICATION: CLUE DECODED (true sign or mirage warning) */}
        {recentCluePopup && (
          <div
            style={{
              position: 'absolute',
              top: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: recentCluePopup.isDecoy ? 'rgba(69, 10, 10, 0.96)' : 'rgba(28, 25, 23, 0.95)',
              border: `2px solid ${recentCluePopup.isDecoy ? '#ef4444' : '#d97706'}`,
              borderRadius: 12,
              padding: '14px 20px',
              maxWidth: 460,
              color: recentCluePopup.isDecoy ? '#fecaca' : '#fef3c7',
              boxShadow: recentCluePopup.isDecoy ? '0 8px 24px rgba(239,68,68,0.45)' : '0 8px 24px rgba(0,0,0,0.6)',
              pointerEvents: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: recentCluePopup.isDecoy ? '#f87171' : '#fbbf24', fontWeight: 700 }}>
                {recentCluePopup.isDecoy
                  ? `False Lead — −${DIFFICULTIES[telemetry.difficulty].miragePenalty}s Expedition Time`
                  : 'Sign Decoded & Recorded in Journal'}
              </span>
              <button
                onClick={() => setRecentCluePopup(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: 15, color: recentCluePopup.isDecoy ? '#fca5a5' : '#38bdf8' }}>
              {SIGN_ICONS[recentCluePopup.signType]} {recentCluePopup.title}
            </h4>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4, color: '#cbd5e1' }}>{recentCluePopup.description}</p>
          </div>
        )}

        {/* POPUP NOTIFICATION: WATER SOURCE CONFIRMED */}
        {recentWaterPopup && (
          <div
            style={{
              position: 'absolute',
              top: 170,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(3, 105, 161, 0.95)',
              border: '2px solid #38bdf8',
              borderRadius: 12,
              padding: '14px 20px',
              maxWidth: 460,
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(56, 189, 248, 0.4)',
              pointerEvents: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#bae6fd', fontWeight: 800 }}>
                Water Reserve Verified! {recentWaterPopup.count}/{recentWaterPopup.total} · Hydration +15%
              </span>
              <button
                onClick={() => setRecentWaterPopup(null)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>
            <h4 style={{ margin: '0 0 2px 0', fontSize: 15, color: '#f0fdf4' }}>{recentWaterPopup.name}</h4>
            <p style={{ margin: 0, fontSize: 12, color: '#e0f2fe' }}>Location: {recentWaterPopup.locationName}</p>
          </div>
        )}

        {/* MOBILE ON-SCREEN TOUCH CONTROLS */}
        {phase === 'PLAYING' && isTouchDevice && (
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              right: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              pointerEvents: 'none',
            }}
          >
            {/* Virtual D-Pad */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 48px)',
                gridTemplateRows: 'repeat(3, 48px)',
                gap: 4,
                pointerEvents: 'auto',
              }}
            >
              <div />
              <button
                onPointerDown={() => handleTouchDir(0, -1)}
                onPointerUp={() => handleTouchDir(0, 0)}
                onPointerLeave={() => handleTouchDir(0, 0)}
                style={{
                  backgroundColor: 'rgba(28, 25, 23, 0.8)',
                  border: '1px solid #78350f',
                  borderRadius: 8,
                  color: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                ▲
              </button>
              <div />
              <button
                onPointerDown={() => handleTouchDir(-1, 0)}
                onPointerUp={() => handleTouchDir(0, 0)}
                onPointerLeave={() => handleTouchDir(0, 0)}
                style={{
                  backgroundColor: 'rgba(28, 25, 23, 0.8)',
                  border: '1px solid #78350f',
                  borderRadius: 8,
                  color: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                ◀
              </button>
              <div style={{ backgroundColor: 'rgba(28, 25, 23, 0.4)', borderRadius: 8 }} />
              <button
                onPointerDown={() => handleTouchDir(1, 0)}
                onPointerUp={() => handleTouchDir(0, 0)}
                onPointerLeave={() => handleTouchDir(0, 0)}
                style={{
                  backgroundColor: 'rgba(28, 25, 23, 0.8)',
                  border: '1px solid #78350f',
                  borderRadius: 8,
                  color: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                ▶
              </button>
              <div />
              <button
                onPointerDown={() => handleTouchDir(0, 1)}
                onPointerUp={() => handleTouchDir(0, 0)}
                onPointerLeave={() => handleTouchDir(0, 0)}
                style={{
                  backgroundColor: 'rgba(28, 25, 23, 0.8)',
                  border: '1px solid #78350f',
                  borderRadius: 8,
                  color: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                ▼
              </button>
              <div />
            </div>

            {/* Big Observe & Focus Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'auto' }}>
              <button
                onClick={handleFocus}
                disabled={telemetry.focusRemaining <= 0 || telemetry.isFocusActive}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: telemetry.focusRemaining > 0 && !telemetry.isFocusActive ? '#ca8a04' : '#44403c',
                  border: '2px solid #facc15',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  cursor: telemetry.focusRemaining > 0 && !telemetry.isFocusActive ? 'pointer' : 'not-allowed',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                  userSelect: 'none',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                </svg>
                <span>FOCUS {telemetry.focusRemaining}</span>
              </button>
              <button
                onClick={handleObserve}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  backgroundColor: telemetry.nearbyClue ? '#0284c7' : '#78350f',
                  border: '2px solid #f59e0b',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: 11,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                  userSelect: 'none',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
                <span>OBSERVE</span>
              </button>
            </div>
          </div>
        )}

        {/* FIELD JOURNAL MODAL OVERLAY */}
        {isJournalOpen && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
              padding: 20,
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 640,
                maxHeight: '85vh',
                backgroundColor: '#1c1917',
                border: '2px solid #d97706',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                color: '#fef3c7',
                boxShadow: '0 12px 32px rgba(0,0,0,0.8)',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#fbbf24">
                    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
                  </svg>
                  <h3 style={{ margin: 0, fontSize: 20, color: '#fef08a' }}>Scout's Field Journal</h3>
                </div>
                <button
                  onClick={() => setIsJournalOpen(false)}
                  style={{
                    backgroundColor: '#451a03',
                    border: '1px solid #78350f',
                    color: '#fef3c7',
                    borderRadius: 8,
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Close [ESC]
                </button>
              </div>

              {/* Category Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {(
                  [
                    { key: 'all', label: `All Signs (${discoveredClues.length})` },
                    { key: 'birds', label: '🕊️ Birds' },
                    { key: 'vegetation', label: '🌿 Vegetation' },
                    { key: 'tracks', label: '🐾 Tracks' },
                    { key: 'mirage', label: '🌫️ Mirages' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setJournalTab(tab.key)}
                    style={{
                      backgroundColor: journalTab === tab.key ? '#d97706' : '#292524',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Clues List */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 6 }}>
                {filteredClues.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#a8a29e' }}>
                    <p style={{ fontSize: 14 }}>No signs recorded in this category yet.</p>
                    <p style={{ fontSize: 12 }}>Follow bird flocks, green vegetation, and animal tracks — or press [F] Focus to attune to nearby signs.</p>
                  </div>
                ) : (
                  filteredClues.map((clue) => (
                    <div
                      key={clue.id}
                      style={{
                        backgroundColor: clue.isDecoy ? '#3f1414' : '#292524',
                        border: `1px solid ${clue.isDecoy ? '#7f1d1d' : '#44403c'}`,
                        borderRadius: 10,
                        padding: 14,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: clue.isDecoy ? '#fca5a5' : '#38bdf8' }}>
                          {SIGN_ICONS[clue.signType]} {clue.title}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            textTransform: 'uppercase',
                            backgroundColor: clue.isDecoy ? '#b91c1c' : '#0284c7',
                            color: '#ffffff',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontWeight: 700,
                          }}
                        >
                          {clue.categoryLabel}{clue.pointsTo ? ` → ${clue.pointsTo}` : ''}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#e2e8f0', lineHeight: 1.4 }}>{clue.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* MENU / TITLE SCREEN OVERLAY */}
        {phase === 'MENU' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(28, 25, 23, 0.94)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
              padding: 24,
              boxSizing: 'border-box',
              textAlign: 'center',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                maxWidth: 620,
                width: '100%',
                backgroundColor: '#292524',
                border: '2px solid #d97706',
                borderRadius: 20,
                padding: '32px 28px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.8)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  backgroundColor: '#78350f',
                  border: '2px solid #fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#38bdf8">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>

              <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#fef08a', letterSpacing: '0.02em' }}>
                Signs of the Rain
              </h1>

              <p style={{ margin: 0, fontSize: 14, color: '#e2e8f0', lineHeight: 1.6 }}>
                A prolonged drought endangers the Home Village. As the community scout, venture into the vast savanna to read the subtle signs of nature — <strong>bird flocks</strong>, <strong>lush vegetation</strong>, and <strong>animal tracks</strong> — to locate and verify <strong>3 vital water sources</strong> before your reserves run out!
              </p>

              {/* Difficulty Selector (plan §3.1) */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#fbbf24', fontWeight: 700, textAlign: 'left' }}>
                  Choose Expedition Difficulty
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => {
                    const s = DIFFICULTIES[d];
                    const selected = difficulty === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        style={{
                          backgroundColor: selected ? '#78350f' : '#1c1917',
                          border: selected ? '2px solid #fbbf24' : '1px solid #44403c',
                          borderRadius: 12,
                          padding: '12px 8px',
                          cursor: 'pointer',
                          color: '#fef3c7',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          alignItems: 'center',
                          boxShadow: selected ? '0 0 16px rgba(251,191,36,0.35)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', color: selected ? '#fde68a' : '#d6d3d1' }}>
                          {s.label}
                        </span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>⏱ {Math.round(s.timeLimit / 60)} min</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>⚡ {s.maxFocus} Focus</span>
                        <span style={{ fontSize: 10, color: s.decoys > 0 ? '#fca5a5' : '#86efac', lineHeight: 1.3 }}>
                          {s.decoys > 0 ? `${s.decoys} mirage${s.decoys > 1 ? 's' : ''} · −${s.miragePenalty}s` : 'No decoys'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mission Objectives */}
              <div
                style={{
                  width: '100%',
                  backgroundColor: '#1c1917',
                  borderRadius: 12,
                  padding: 14,
                  textAlign: 'left',
                  border: '1px solid #44403c',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#fbbf24', fontWeight: 700 }}>
                  Expedition Briefing
                </span>
                <div style={{ fontSize: 13, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>🌿 <strong>Explore the Savanna:</strong> Move with WASD, Arrow keys, Gamepad, or On-Screen D-Pad.</div>
                  <div>🔍 <strong>Inspect Signs:</strong> Press [E] / [SPACE] or tap [OBSERVE] near glowing landmarks.</div>
                  <div>⚡ <strong>Focus [F]:</strong> Spend a charge to slow time and make nearby signs glow — you must still deduce the true path.</div>
                  <div>💧 <strong>Unlock 3 Water Sources:</strong> Beware mirages ({settings.decoys} on {settings.label}) — verify all 3 regions, then return to the Village Beacon.</div>
                </div>
              </div>

              <button
                onClick={handleStartGame}
                style={{
                  marginTop: 8,
                  backgroundColor: '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px 36px',
                  fontSize: 16,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(217, 119, 6, 0.5)',
                  transition: 'transform 0.1s ease',
                }}
              >
                Begin Expedition — {settings.label}
              </button>
            </div>
          </div>
        )}

        {/* PAUSE SCREEN OVERLAY */}
        {phase === 'PAUSED' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                backgroundColor: '#292524',
                border: '2px solid #78350f',
                borderRadius: 16,
                padding: '32px 40px',
                textAlign: 'center',
                color: '#fef3c7',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 24, color: '#fef08a' }}>Expedition Paused</h2>
              <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>
                {DIFFICULTIES[telemetry.difficulty].label} · Hydration: {telemetry.hydration}% | Water Found: {telemetry.waterFound}/3 | Focus: {telemetry.focusRemaining}/{telemetry.maxFocus}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={handleTogglePause}
                  style={{
                    backgroundColor: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 20px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Resume
                </button>
                <button
                  onClick={handleResetExpedition}
                  style={{
                    backgroundColor: '#451a03',
                    color: '#fef3c7',
                    border: '1px solid #78350f',
                    borderRadius: 8,
                    padding: '10px 20px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Restart
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VICTORY / FINISHED SCREEN OVERLAY */}
        {phase === 'FINISHED' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(12, 74, 110, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
              padding: 24,
              boxSizing: 'border-box',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                maxWidth: 540,
                backgroundColor: '#082f49',
                border: '2px solid #38bdf8',
                borderRadius: 20,
                padding: '36px 28px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.8)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                color: '#ffffff',
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  backgroundColor: '#0369a1',
                  border: '2px solid #7dd3fc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="#38bdf8">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>

              <h2 style={{ margin: 0, fontSize: 28, color: '#bae6fd', fontWeight: 800 }}>
                The Rain & Water Have Returned!
              </h2>

              <p style={{ margin: 0, fontSize: 14, color: '#e0f2fe', lineHeight: 1.5 }}>
                Through your keen observation of nature's signs, you unlocked all 3 subterranean aquifers and guided the community back to safety. The drought has been conquered!
              </p>

              <div
                style={{
                  width: '100%',
                  backgroundColor: '#0c4a6e',
                  borderRadius: 12,
                  padding: 16,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 10,
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: '#7dd3fc', textTransform: 'uppercase' }}>Difficulty</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fde68a' }}>{DIFFICULTIES[telemetry.difficulty].label}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#7dd3fc', textTransform: 'uppercase' }}>Water Secured</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f0fdf4' }}>3 / 3</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#7dd3fc', textTransform: 'uppercase' }}>Signs Decoded</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fef08a' }}>{telemetry.cluesFound} / {telemetry.totalClues}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#7dd3fc', textTransform: 'uppercase' }}>Time Left</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8' }}>{formatTime(telemetry.timeRemaining)}</div>
                </div>
              </div>

              <button
                onClick={handleResetExpedition}
                style={{
                  marginTop: 8,
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px 36px',
                  fontSize: 16,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(2, 132, 199, 0.5)',
                }}
              >
                Expedition Complete — Replay [Enter]
              </button>
            </div>
          </div>
        )}

        {/* GAMEOVER SCREEN OVERLAY */}
        {phase === 'GAMEOVER' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(69, 10, 10, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
              padding: 24,
              boxSizing: 'border-box',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                maxWidth: 500,
                backgroundColor: '#2b0a0a',
                border: '2px solid #ef4444',
                borderRadius: 20,
                padding: '36px 28px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.8)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                color: '#ffffff',
              }}
            >
              <h2 style={{ margin: 0, fontSize: 26, color: '#fca5a5', fontWeight: 800 }}>
                Expedition Exhausted
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: '#fecaca', lineHeight: 1.5 }}>
                {telemetry.hydration <= 0
                  ? 'Your hydration depleted before uncovering the necessary water reserves.'
                  : 'Time ran out before you could verify all 3 water sources and return to camp.'}
              </p>
              <div style={{ fontSize: 13, color: '#fda4af' }}>
                {DIFFICULTIES[telemetry.difficulty].label} · Water {telemetry.waterFound}/3 · Signs {telemetry.cluesFound}/{telemetry.totalClues} · Focus used {telemetry.maxFocus - telemetry.focusRemaining}/{telemetry.maxFocus}
              </div>
              <button
                onClick={handleResetExpedition}
                style={{
                  marginTop: 8,
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 32px',
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(220, 38, 38, 0.5)',
                }}
              >
                Try Again [Space / Enter]
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
