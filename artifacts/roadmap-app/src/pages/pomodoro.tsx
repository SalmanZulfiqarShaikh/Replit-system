import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Music, Timer as TimerIcon } from "lucide-react";
import { useCreatePomodoroSession } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const PRESETS = [
  { label: "25 / 5", work: 25, break: 5, desc: "Standard Pomodoro" },
  { label: "60 / 10", work: 60, break: 10, desc: "Deep Work" },
  { label: "90 / 30", work: 90, break: 30, desc: "Ultra Focus" },
];

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

export default function Pomodoro() {
  const { toast } = useToast();
  const createSession = useCreatePomodoroSession();

  const [presetIdx, setPresetIdx] = useState(0);
  const preset = PRESETS[presetIdx];

  const [mode, setMode] = useState<"work" | "break">("work");
  const [isActive, setIsActive] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(preset.work * 60);

  const prevPresetRef = useRef(presetIdx);
  const prevModeRef = useRef(mode);

  useEffect(() => {
    const presetChanged = prevPresetRef.current !== presetIdx;
    const modeChanged = prevModeRef.current !== mode;
    prevPresetRef.current = presetIdx;
    prevModeRef.current = mode;

    if (presetChanged || modeChanged) {
      setIsActive(false);
      setIsStarted(false);
      setTimeLeft((mode === "work" ? preset.work : preset.break) * 60);
    }
  }, [presetIdx, mode, preset.work, preset.break]);

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

  const handleComplete = async () => {
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
        await createSession.mutateAsync({ data: { workDuration: preset.work, breakDuration: preset.break } });
      } catch (_) {}
      setMode("break");
      setTimeLeft(preset.break * 60);
    } else {
      toast({
        title: "BREAK OVER",
        description: "Back to work.",
        className: "font-mono",
      });
      setMode("work");
      setTimeLeft(preset.work * 60);
    }
  };

  const toggleTimer = () => {
    if (!isActive && !isStarted && mode === "work") {
      window.open("https://open.spotify.com/search/lo-fi%20study", "_blank");
    }
    if (!isActive) setIsStarted(true);
    setIsActive((a) => !a);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsStarted(false);
    setTimeLeft((mode === "work" ? preset.work : preset.break) * 60);
  };

  const switchMode = (m: "work" | "break") => {
    if (mode !== m) setMode(m);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalSeconds = (mode === "work" ? preset.work : preset.break) * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[80vh] gap-8"
    >
      <div className="text-center">
        <h1 className="text-2xl font-mono font-bold text-white flex items-center justify-center gap-3">
          <TimerIcon className="w-6 h-6" />
          Focus Protocol
        </h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">Pomodoro timer with pause support</p>
      </div>

      {/* Preset Selector */}
      <div className="flex gap-2">
        {PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => setPresetIdx(i)}
            disabled={isActive}
            className={`px-4 py-2 rounded-lg border font-mono text-sm transition-all ${
              presetIdx === i
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary border-border text-muted-foreground hover:border-white/30 hover:text-white disabled:opacity-40"
            }`}
          >
            <div className="font-bold">{p.label}</div>
            <div className="text-xs opacity-70">{p.desc}</div>
          </button>
        ))}
      </div>

      {/* Timer Card */}
      <div className="bg-card border border-border rounded-2xl p-8 md:p-12 flex flex-col items-center gap-8">
        {/* Mode Toggle */}
        <div className="flex bg-secondary p-1 rounded-full border border-border">
          <button
            onClick={() => switchMode("work")}
            disabled={isActive}
            className={`px-6 py-2 rounded-full font-mono text-sm font-bold transition-all disabled:opacity-60 ${
              mode === "work" ? "bg-white text-black" : "text-muted-foreground hover:text-white"
            }`}
          >
            FOCUS
          </button>
          <button
            onClick={() => switchMode("break")}
            disabled={isActive}
            className={`px-6 py-2 rounded-full font-mono text-sm font-bold transition-all disabled:opacity-60 ${
              mode === "break" ? "bg-white text-black" : "text-muted-foreground hover:text-white"
            }`}
          >
            BREAK
          </button>
        </div>

        {/* SVG Ring Timer */}
        <div className="relative flex items-center justify-center w-[280px] h-[280px]">
          <svg className="absolute w-full h-full -rotate-90">
            <circle cx="140" cy="140" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-secondary" />
            <motion.circle
              cx="140" cy="140" r={radius}
              fill="none"
              stroke="white"
              strokeWidth="6"
              strokeLinecap="round"
              style={{ strokeDasharray: circumference, strokeDashoffset }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </svg>
          <div className="text-center">
            <h2 className="text-6xl font-mono font-bold text-white tracking-tighter">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </h2>
            <p className="text-muted-foreground font-mono mt-2 text-xs uppercase tracking-widest">
              {mode === "work" ? (isActive ? "focusing..." : isStarted ? "paused" : "ready") : "break time"}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={resetTimer}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-secondary border border-border text-muted-foreground hover:text-white hover:border-white/30 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTimer}
            className="w-18 h-18 w-[4.5rem] h-[4.5rem] flex items-center justify-center rounded-full bg-white text-black hover:bg-white/90 transition-all active:scale-95 shadow-lg shadow-white/10"
          >
            {isActive ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>

          <button
            onClick={() => window.open("https://open.spotify.com/search/lo-fi%20study", "_blank")}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-secondary border border-border text-muted-foreground hover:text-white hover:border-white/30 transition-all"
            title="Open Spotify"
          >
            <Music className="w-5 h-5" />
          </button>
        </div>
      </div>

      <p className="text-xs font-mono text-muted-foreground/60">
        Pause preserves your progress · Switch presets when idle
      </p>
    </motion.div>
  );
}
