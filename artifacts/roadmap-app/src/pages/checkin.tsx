import { useState } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Sparkles, Bot, Clock, Building, GraduationCap, Loader2 } from "lucide-react";
import { useGetTodayCheckin, useCreateCheckin, useGenerateSchedule } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Checkin() {
  const { toast } = useToast();
  const { data: todayCheckin, isLoading: checkinLoading } = useGetTodayCheckin();
  const createCheckin = useCreateCheckin();
  const generateSchedule = useGenerateSchedule();

  const [hasUni, setHasUni] = useState(false);
  const [hasOffice, setHasOffice] = useState(false);
  const [tasks, setTasks] = useState("");
  const [availableHours, setAvailableHours] = useState(4);
  const [aiSchedule, setAiSchedule] = useState<any>(null);

  // If we already have a checkin, populate state initially (simple effect omitted for brevity, relying on user submitting new if needed)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tasks.trim()) {
      toast({ title: "Input Required", description: "Please enter your tasks.", variant: "destructive" });
      return;
    }

    try {
      // 1. Save checkin
      await createCheckin.mutateAsync({ data: { hasUni, hasOffice, tasks, availableHours }});
      
      // 2. Generate Schedule
      const scheduleRes = await generateSchedule.mutateAsync({ 
        data: { 
          hasUni, 
          hasOffice, 
          tasks, 
          availableHours, 
          currentPhase: "phase-1" 
        }
      });
      
      setAiSchedule(scheduleRes);
      
      toast({
        title: "SYSTEM UPDATED",
        description: "Check-in logged and AI schedule generated.",
        className: "bg-primary border-primary text-primary-foreground font-mono"
      });
    } catch (err) {
      toast({ title: "Error", description: "Failed to process check-in.", variant: "destructive" });
    }
  };

  const isPending = createCheckin.isPending || generateSchedule.isPending;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-8">
      <header className="border-b border-border/50 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-mono font-bold text-white flex items-center gap-3">
              <CheckSquare className="text-primary w-8 h-8" />
              Daily Initialization
            </h1>
            <p className="text-muted-foreground font-mono mt-2">{format(new Date(), "EEEE, MMMM do, yyyy")}</p>
          </div>
          {todayCheckin && !isPending && (
            <div className="px-3 py-1 border border-primary/30 bg-primary/10 text-primary text-xs font-mono rounded-full flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              ALREADY LOGGED
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-opacity group-hover:opacity-10">
              <Bot className="w-32 h-32" />
            </div>

            <div className="space-y-4 relative z-10">
              <h2 className="text-lg font-mono font-bold text-white border-b border-border/50 pb-2">Constraints</h2>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setHasUni(!hasUni)}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${hasUni ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary border-border text-muted-foreground hover:border-muted-foreground'}`}
                >
                  <GraduationCap className="w-6 h-6" />
                  <span className="font-mono text-sm">University</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHasOffice(!hasOffice)}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${hasOffice ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary border-border text-muted-foreground hover:border-muted-foreground'}`}
                >
                  <Building className="w-6 h-6" />
                  <span className="font-mono text-sm">Office</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-mono text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Available Coding Hours</span>
                  <span className="text-primary font-bold text-lg">{availableHours}h</span>
                </label>
                <input 
                  type="range" 
                  min="1" max="8" step="1"
                  value={availableHours}
                  onChange={(e) => setAvailableHours(parseInt(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-sm font-mono text-muted-foreground">Planned Tasks (Freeform)</label>
                <textarea 
                  value={tasks}
                  onChange={(e) => setTasks(e.target.value)}
                  placeholder="e.g., Finish ep 25, debug API, read LangChain docs..."
                  className="w-full h-32 bg-secondary/50 border border-border rounded-xl p-4 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-primary text-primary-foreground font-mono font-bold rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative z-10"
            >
              {isPending ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> GENERATING...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> GENERATE OPTIMIZED SCHEDULE</>
              )}
            </button>
          </form>
        </div>

        {/* Output Section */}
        <div>
          {aiSchedule ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-primary/30 rounded-xl p-6 space-y-6 shadow-[0_0_30px_-10px_rgba(29,185,84,0.15)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
              
              <div>
                <h2 className="text-lg font-mono font-bold text-primary flex items-center gap-2 mb-4">
                  <Bot className="w-5 h-5" />
                  AI Protocol Generated
                </h2>
                <div className="p-4 bg-secondary/50 rounded-lg border border-border/50 text-sm font-sans text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {aiSchedule.schedule}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-mono font-bold text-white mb-3 border-b border-border/50 pb-2">Extracted Action Items</h3>
                <ul className="space-y-2">
                  {aiSchedule.tasks.map((task: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-mono">
                      <div className="mt-0.5 w-4 h-4 rounded border border-primary/50 flex-shrink-0 bg-primary/5" />
                      <span className="text-foreground/90">{task}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h3 className="text-xs font-mono font-bold text-primary mb-1 uppercase tracking-wider">Pomodoro Target</h3>
                <p className="text-sm font-mono text-white/90">{aiSchedule.pomodoroRecommendation}</p>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border border-dashed border-border/50 rounded-xl bg-secondary/20 p-8 text-center min-h-[400px]">
              <Bot className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="font-mono text-muted-foreground">Awaiting input parameters to<br/>generate daily protocol.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
