import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { useCreatePomodoroSession } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const PRESETS = [
  { label: "25 / 5", work: 25, break: 5, desc: "Standard Pomodoro" },
  { label: "60 / 10", work: 60, break: 10, desc: "Deep Work" },
  { label: "90 / 30", work: 90, break: 30, desc: "Ultra Focus" },
];

const STORAGE_KEY = "pomodoro-state-v1";

interface StoredState {
  presetIdx: number;
  mode: "work" | "break";
  timeLeft: number;
  isStarted: boolean;
}

function loadState(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredState;
  } catch {
    return null;
  }
}

function saveState(s: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

interface PomodoroContextValue {
  PRESETS: typeof PRESETS;
  presetIdx: number;
  setPresetIdx: (idx: number) => void;
  mode: "work" | "break";
  isActive: boolean;
  isStarted: boolean;
  timeLeft: number;
  toggleTimer: () => void;
  resetTimer: () => void;
  switchMode: (m: "work" | "break") => void;
  openFocusMusic: () => void;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const createSession = useCreatePomodoroSession();

  const saved = loadState();

  const [presetIdx, setPresetIdxRaw] = useState(saved?.presetIdx ?? 0);
  const [mode, setMode] = useState<"work" | "break">(saved?.mode ?? "work");
  const [isActive, setIsActive] = useState(false);
  const [isStarted, setIsStarted] = useState(saved?.isStarted ?? false);
  const [timeLeft, setTimeLeft] = useState(() => {
    if (saved) return saved.timeLeft;
    return PRESETS[0].work * 60;
  });

  const preset = PRESETS[presetIdx];

  // Persist to localStorage whenever key state changes
  useEffect(() => {
    saveState({ presetIdx, mode, timeLeft, isStarted });
  }, [presetIdx, mode, timeLeft, isStarted]);

  // Timer tick
  useEffect(() => {
    if (!isActive) return;
    if (timeLeft <= 0) {
      handleComplete();
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = useCallback(async () => {
    setIsActive(false);
    setIsStarted(false);
    playBeep();

    if (mode === "work") {
      toast({
        title: "FOCUS SESSION COMPLETE",
        description: `${preset.work} min logged. Take a break.`,
        className: "bg-primary border-primary text-primary-foreground font-mono",
      });
      try {
        await createSession.mutateAsync({
          data: { workDuration: preset.work, breakDuration: preset.break },
        });
      } catch (_) {}
      setMode("break");
      setTimeLeft(preset.break * 60);
    } else {
      toast({ title: "BREAK OVER", description: "Back to work.", className: "font-mono" });
      setMode("work");
      setTimeLeft(preset.work * 60);
    }
  }, [mode, preset, toast, createSession]);

  const setPresetIdx = (idx: number) => {
    if (isActive) return;
    setPresetIdxRaw(idx);
    setIsActive(false);
    setIsStarted(false);
    setTimeLeft((mode === "work" ? PRESETS[idx].work : PRESETS[idx].break) * 60);
  };

  const switchMode = (m: "work" | "break") => {
    if (isActive || mode === m) return;
    setMode(m);
    setIsActive(false);
    setIsStarted(false);
    setTimeLeft((m === "work" ? preset.work : preset.break) * 60);
  };

  const openFocusMusic = () => {
    const SPOTIFY_APP_URI = "spotify:playlist:37i9dQZF1DX8Uebhn9wzrS";
    const SPOTIFY_WEB_URL = "https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS";
    let appLaunched = false;
    const onBlur = () => { appLaunched = true; };
    window.addEventListener("blur", onBlur, { once: true });
    window.location.href = SPOTIFY_APP_URI;
    setTimeout(() => {
      window.removeEventListener("blur", onBlur);
      if (!appLaunched) window.open(SPOTIFY_WEB_URL, "_blank");
    }, 1500);
  };

  const toggleTimer = () => {
    if (!isActive && !isStarted && mode === "work") openFocusMusic();
    if (!isActive) setIsStarted(true);
    setIsActive((a) => !a);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsStarted(false);
    setTimeLeft((mode === "work" ? preset.work : preset.break) * 60);
  };

  return (
    <PomodoroContext.Provider
      value={{ PRESETS, presetIdx, setPresetIdx, mode, isActive, isStarted, timeLeft, toggleTimer, resetTimer, switchMode, openFocusMusic }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoro must be used within PomodoroProvider");
  return ctx;
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch (_) {}
}
