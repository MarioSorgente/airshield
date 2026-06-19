import { useState, useEffect, useCallback, useRef } from 'react';
import ControlPanel from '../sections/ControlPanel';
import MorphCanvas from '../sections/MorphCanvas';
import TodoList from '../sections/TodoList';
import { useTodos } from '../hooks/useTodos';
import type { TodoItem } from '../types/todo';
import type { MorphStyle } from '../sections/MorphCanvas';
import { THEMES, type Theme } from '../types/theme';
import { useAuth } from '@/hooks/useAuth';
import { LogIn } from 'lucide-react';

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

type Mode = 'timer' | 'stopwatch' | 'pomodoro';

function pad2(n: number) { return String(n).padStart(2, '0'); }

const STYLE_LABELS: Record<MorphStyle, string> = {
  blob: 'BLOB',
  lattice: 'LATTICE',
  metamorph: 'METAMORPH',
  particles: 'PARTICLES',
};

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();

  // ---- Timer state ----
  const [mode, setMode] = useState<Mode>('timer');
  const [totalTimeMs, setTotalTimeMs] = useState(25 * 60 * 1000);
  const [timeLeftMs, setTimeLeftMs] = useState(25 * 60 * 1000);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // ---- Visual params ----
  const [theme, setTheme] = useState<Theme>(THEMES[0]);
  const [morphStyle, setMorphStyle] = useState<MorphStyle>('blob');
  const [density, setDensity] = useState(1.4);
  const [turbulence, setTurbulence] = useState(0.8);
  const [hueShift, setHueShift] = useState(0);
  const [breathSpeed, setBreathSpeed] = useState(1.0);

  // ---- Todos ----
  const {
    todos,
    addTodo, removeTodo, completeTodo, uncompleteTodo,
  } = useTodos();
  const [activeTodoId, setActiveTodoId] = useState<number | null>(null);

  // ---- Timer refs ----
  const animRef = useRef<number>(0);
  const lastT = useRef<number>(0);
  const acc = useRef<number>(0);
  const completingRef = useRef(false);

  // ---- Timer loop ----
  useEffect(() => {
    if (!isRunning) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    lastT.current = performance.now();
    acc.current = 0;
    const tick = (now: number) => {
      const dt = now - lastT.current;
      lastT.current = now;
      acc.current += dt;
      if (acc.current >= 16) {
        const step = acc.current;
        acc.current = 0;
        if (mode === 'stopwatch') {
          setElapsedMs(p => p + step);
        } else {
          setTimeLeftMs(prev => {
            const n = prev - step;
            if (n <= 0) {
              setIsRunning(false);
              setIsCompleted(true);
              if (activeTodoId && !completingRef.current) {
                completingRef.current = true;
                completeTodo(activeTodoId);
                setTimeout(() => { completingRef.current = false; }, 100);
              }
              return 0;
            }
            return n;
          });
        }
      }
      if (isRunning) animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isRunning, mode, activeTodoId, completeTodo]);

  // Push theme panel colors into CSS variables so every panel / border / label
  // recolors together when the theme changes.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--panel-dark', theme.panelDark);
    root.style.setProperty('--panel-mid', theme.panelMid);
    root.style.setProperty('--panel-light', theme.panelLight);
    root.style.setProperty('--accent', theme.color1);
    root.style.setProperty('--accent-soft', theme.color2);
    root.style.setProperty('--text-muted', theme.textMuted);
  }, [theme]);

  const toggle = useCallback(() => {
    if (isCompleted) {
      setIsCompleted(false);
      if (mode === 'stopwatch') setElapsedMs(0);
      else setTimeLeftMs(totalTimeMs);
      setIsRunning(true);
    } else setIsRunning(p => !p);
  }, [isCompleted, mode, totalTimeMs]);

  const changeMode = useCallback((m: Mode) => {
    setMode(m); setIsRunning(false); setIsCompleted(false); acc.current = 0; setElapsedMs(0);
    setActiveTodoId(null);
    if (m === 'stopwatch') { setTotalTimeMs(0); setTimeLeftMs(0); }
    else { const ms = 25 * 60 * 1000; setTotalTimeMs(ms); setTimeLeftMs(ms); }
  }, []);

  const handleSelectTodo = useCallback((todo: TodoItem) => {
    setActiveTodoId(todo.id);
    setIsRunning(false); setIsCompleted(false); setMode('timer');
    setTotalTimeMs(todo.durationMs); setTimeLeftMs(todo.durationMs);
    setElapsedMs(0); acc.current = 0;
  }, []);

  const handleToggleComplete = useCallback((todo: TodoItem) => {
    todo.completedAt ? uncompleteTodo(todo.id) : completeTodo(todo.id);
  }, [completeTodo, uncompleteTodo]);

  // ---- Display values ----
  const dispMs = mode === 'stopwatch' ? elapsedMs : timeLeftMs;
  const shaderLeft = mode === 'stopwatch' ? 1 : timeLeftMs;
  const shaderTotal = mode === 'stopwatch' ? 1 : totalTimeMs;
  const progress = totalTimeMs > 0 ? timeLeftMs / totalTimeMs : 0;

  const activeTodo = activeTodoId ? todos.find((t: TodoItem) => t.id === activeTodoId) ?? null : null;

  return (
    <div className="w-screen h-screen bg-[var(--panel-dark)] flex overflow-hidden">
      {/* ======== LEFT: Control Panel ======== */}
      <div className="w-[360px] min-w-[320px] h-full flex-shrink-0 border-r border-[var(--panel-mid)] overflow-y-auto">
        <ControlPanel
          mode={mode} setMode={changeMode} setTotalTimeMs={setTotalTimeMs}
          isRunning={isRunning} isCompleted={isCompleted}
          elapsedMs={elapsedMs} timeLeftMs={timeLeftMs}
          onToggleRunning={toggle} activeTodo={activeTodo}
          density={density} setDensity={setDensity}
          turbulence={turbulence} setTurbulence={setTurbulence}
          hueShift={hueShift} setHueShift={setHueShift}
          breathSpeed={breathSpeed} setBreathSpeed={setBreathSpeed}
          theme={theme} setTheme={setTheme}
          isAuthenticated={isAuthenticated}
          userName={user?.name || null}
          onLogin={() => { window.location.href = getOAuthUrl(); }}
          onLogout={logout}
        />
      </div>

      {/* ======== CENTER: Morph Canvas ======== */}
      <div className="flex-1 h-full flex flex-col min-w-0">
        {/* Canvas area */}
        <div className="flex-1 relative min-h-0">
          {/* Time overlay - top left */}
          <div className="absolute top-5 left-5 z-10">
            <div className="border border-[var(--panel-mid)] px-4 py-2">
              <p className="text-[9px] font-bold text-[var(--panel-light)] tracking-[0.2em] mb-0.5">
                {mode === 'stopwatch' ? 'ELAPSED' : 'REMAINING'}
              </p>
              <p className="text-xl font-black tabular-nums text-white">
                {pad2(Math.floor(dispMs / 60000))}:{pad2(Math.floor((dispMs % 60000) / 1000))}
                <span className="text-sm font-medium text-[var(--accent)]">.{pad2(Math.floor((dispMs % 1000) / 10))}</span>
              </p>
            </div>
          </div>

          {/* Active todo badge - top right */}
          {activeTodo && !activeTodo.completedAt && (
            <div className="absolute top-5 right-5 z-10">
              <div className="border border-[var(--accent)] px-3 py-1.5">
                <p className="text-[8px] font-bold text-[var(--accent-soft)] tracking-[0.15em] mb-0.5">FOCUS</p>
                <p className="text-[10px] font-semibold text-white truncate max-w-[160px]">{activeTodo.title}</p>
              </div>
            </div>
          )}

          {/* Progress ring - bottom left */}
          {isRunning && mode !== 'stopwatch' && (
            <div className="absolute bottom-5 left-5 z-10">
              <div className="border border-[var(--panel-mid)] px-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--panel-mid)" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--accent-soft)" strokeWidth="3" strokeDasharray={`${progress * 100}, 100`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white">
                      {Math.round(progress * 100)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-[var(--panel-light)] tracking-[0.2em]">PROGRESS</p>
                    <p className="text-[10px] font-black text-white">{progress > 0.3 ? 'NORMAL' : 'LOW'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <MorphCanvas
            style={morphStyle}
            isRunning={isRunning} isCompleted={isCompleted}
            timeLeftMs={shaderLeft} totalTimeMs={shaderTotal}
            density={density} turbulence={turbulence}
            hueShift={hueShift} breathSpeed={breathSpeed}
            theme={theme}
          />
        </div>

        {/* Style switcher - CENTER BOTTOM */}
        <div className="h-px bg-[var(--panel-mid)] flex-shrink-0" />
        <div className="flex-shrink-0 flex items-center justify-center gap-0 px-4 h-[46px]">
          <span className="text-[9px] font-bold text-[var(--panel-light)] tracking-[0.15em] mr-3">VISUAL MODE</span>
          <div className="flex border border-[var(--panel-mid)] overflow-hidden">
            {(['blob', 'lattice', 'metamorph', 'particles'] as MorphStyle[]).map((s) => (
              <button
                key={s}
                onClick={() => setMorphStyle(s)}
                className={`px-4 py-1.5 text-[9px] font-bold tracking-[0.1em] transition-colors ${
                  morphStyle === s
                    ? 'bg-white text-[var(--panel-dark)]'
                    : 'text-[var(--panel-light)] hover:text-white hover:bg-[var(--panel-mid)]'
                }`}
              >
                {STYLE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ======== RIGHT: Todo List ======== */}
      <div className="w-[340px] min-w-[300px] h-full flex-shrink-0 border-l border-[var(--panel-mid)] overflow-hidden">
        <TodoList
          todos={todos} activeTodoId={activeTodoId}
          onSelectTodo={handleSelectTodo}
          onAddTodo={addTodo} onRemoveTodo={removeTodo}
          onToggleComplete={handleToggleComplete}
        />
      </div>

      {/* ======== SIGN IN OVERLAY ======== */}
      {!isAuthenticated && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(11, 27, 94, 0.85)', backdropFilter: 'blur(8px)' }}
        >
          <div className="border border-[var(--panel-mid)] px-10 py-8 flex flex-col items-center gap-4">
            <h1 className="text-3xl font-black tracking-tight text-white">CHRONOS</h1>
            <p className="text-[10px] font-semibold text-[var(--panel-light)] tracking-[0.2em]">
              TIME &amp; TASK MANAGEMENT
            </p>
            <div className="h-px w-full bg-[var(--panel-mid)] my-2" />
            <button
              onClick={() => { window.location.href = getOAuthUrl(); }}
              className="flex items-center gap-2 px-6 py-2.5 border border-white text-[10px] font-black tracking-[0.2em] text-white hover:bg-white hover:text-[var(--panel-dark)] transition-all"
            >
              <LogIn size={14} strokeWidth={2.5} />
              SIGN IN WITH KIMI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
