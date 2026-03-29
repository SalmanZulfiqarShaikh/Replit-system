import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Music, Timer as TimerIcon } from "lucide-react";
import { usePomodoro } from "@/components/pomodoro-context";

export default function Pomodoro() {
  const { PRESETS, presetIdx, setPresetIdx, mode, isActive, isStarted, timeLeft, toggleTimer, resetTimer, switchMode, openFocusMusic } = usePomodoro();

  const preset = PRESETS[presetIdx];
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
        <p className="text-muted-foreground font-mono text-sm mt-1">Runs in background while you navigate</p>
      </div>

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

      <div className="bg-card border border-border rounded-2xl p-8 md:p-12 flex flex-col items-center gap-8">
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
              {mode === "work" ? (isActive ? "focusing..." : isStarted ? "paused" : "ready") : (isActive ? "on break..." : "break ready")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={resetTimer}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-secondary border border-border text-muted-foreground hover:text-white hover:border-white/30 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={toggleTimer}
            className="w-[4.5rem] h-[4.5rem] flex items-center justify-center rounded-full bg-white text-black hover:bg-white/90 transition-all active:scale-95 shadow-lg shadow-white/10"
          >
            {isActive ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>
          <button
            onClick={openFocusMusic}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-secondary border border-border text-muted-foreground hover:text-white hover:border-white/30 transition-all"
            title="Lo-fi Focus Music"
          >
            <Music className="w-5 h-5" />
          </button>
        </div>
      </div>

      <p className="text-xs font-mono text-muted-foreground/60">
        Timer keeps running while you navigate · State saved automatically
      </p>
    </motion.div>
  );
}
