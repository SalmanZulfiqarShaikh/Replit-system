import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Music, Timer as TimerIcon } from "lucide-react";
import { useCreatePomodoroSession } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { playBeep } from "@/lib/utils";

export default function Pomodoro() {
  const { toast } = useToast();
  const createSession = useCreatePomodoroSession();
  
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [workDuration, setWorkDuration] = useState(25); // minutes
  const [breakDuration, setBreakDuration] = useState(5);
  
  const [timeLeft, setTimeLeft] = useState(workDuration * 60);
  const [isActive, setIsActive] = useState(false);

  // Update time left when durations change and not active
  useEffect(() => {
    if (!isActive) {
      setTimeLeft((mode === 'work' ? workDuration : breakDuration) * 60);
    }
  }, [workDuration, breakDuration, mode, isActive]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = async () => {
    setIsActive(false);
    playBeep(); // Audio notification
    
    if (mode === 'work') {
      toast({
        title: "FOCUS SESSION COMPLETE",
        description: `Logged ${workDuration} minutes. Take a break!`,
        className: "bg-primary border-primary text-primary-foreground font-mono"
      });
      
      try {
        await createSession.mutateAsync({
          data: { workDuration, breakDuration }
        });
      } catch (e) {
        console.error("Failed to log session");
      }
      
      setMode('break');
      setTimeLeft(breakDuration * 60);
    } else {
      toast({
        title: "BREAK OVER",
        description: "Time to get back to the roadmap.",
        variant: "default",
        className: "font-mono"
      });
      setMode('work');
      setTimeLeft(workDuration * 60);
    }
  };

  const toggleTimer = () => {
    if (!isActive && mode === 'work' && timeLeft === workDuration * 60) {
      // Starting fresh work session
      window.open('https://open.spotify.com', '_blank');
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft((mode === 'work' ? workDuration : breakDuration) * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalSeconds = (mode === 'work' ? workDuration : breakDuration) * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  // SVG Circle calculation
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-mono font-bold text-white flex items-center justify-center gap-3">
          <TimerIcon className="text-primary w-8 h-8" />
          Focus Protocol
        </h1>
        <p className="text-muted-foreground font-mono mt-2">Deep work state initiation</p>
      </div>

      <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 shadow-2xl flex flex-col items-center relative overflow-hidden">
        {/* Glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-b ${mode === 'work' ? 'from-primary/10' : 'from-blue-500/10'} to-transparent opacity-50`} />

        {/* Mode Toggle */}
        <div className="flex bg-secondary p-1 rounded-full mb-10 relative z-10 border border-border">
          <button 
            onClick={() => { setMode('work'); setIsActive(false); }}
            className={`px-6 py-2 rounded-full font-mono text-sm font-bold transition-all ${mode === 'work' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-white'}`}
          >
            FOCUS
          </button>
          <button 
            onClick={() => { setMode('break'); setIsActive(false); }}
            className={`px-6 py-2 rounded-full font-mono text-sm font-bold transition-all ${mode === 'break' ? 'bg-blue-500 text-white shadow-md' : 'text-muted-foreground hover:text-white'}`}
          >
            BREAK
          </button>
        </div>

        {/* Timer Display */}
        <div className="relative flex items-center justify-center w-[300px] h-[300px] mb-10 z-10">
          {/* Background Track */}
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle cx="150" cy="150" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-secondary" />
            <motion.circle 
              cx="150" cy="150" r={radius} 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="8" 
              strokeLinecap="round"
              className={mode === 'work' ? 'text-primary transition-all duration-1000' : 'text-blue-500 transition-all duration-1000'}
              style={{ strokeDasharray: circumference, strokeDashoffset }}
            />
          </svg>
          
          <div className="text-center">
            <h2 className="text-7xl font-mono font-bold tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </h2>
            <p className="text-muted-foreground font-mono mt-2 uppercase text-sm tracking-widest">
              {mode === 'work' ? 'System Active' : 'Cooling Down'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 z-10">
          <button 
            onClick={resetTimer}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-secondary border border-border text-muted-foreground hover:text-white hover:border-white/50 transition-all"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          
          <button 
            onClick={toggleTimer}
            className={`w-20 h-20 flex items-center justify-center rounded-full shadow-lg transition-all transform active:scale-95 ${
              mode === 'work' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/30' : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-blue-500/30'
            }`}
          >
            {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-2" />}
          </button>

          <button 
            onClick={() => window.open('https://open.spotify.com', '_blank')}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-secondary border border-border text-primary hover:bg-primary/10 transition-all"
            title="Open Spotify"
          >
            <Music className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Settings */}
      {!isActive && (
        <div className="mt-8 flex gap-8 text-sm font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Work:</span>
            <select 
              className="bg-secondary border border-border rounded p-1 text-white outline-none"
              value={workDuration}
              onChange={(e) => setWorkDuration(Number(e.target.value))}
            >
              <option value={25}>25 min</option>
              <option value={50}>50 min</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span>Break:</span>
            <select 
              className="bg-secondary border border-border rounded p-1 text-white outline-none"
              value={breakDuration}
              onChange={(e) => setBreakDuration(Number(e.target.value))}
            >
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
            </select>
          </div>
        </div>
      )}
    </motion.div>
  );
}
