import { useState } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Sparkles, Bot, Clock, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useGetTodayCheckin, useCreateCheckin, useGenerateSchedule } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const COMMITMENT_OPTIONS = ["Dawat / Social", "University Assignment", "Family Plan", "Office OT", "Medical / Errand", "Other"];

export default function Checkin() {
  const { toast } = useToast();
  const { data: todayCheckin, isLoading: checkinLoading } = useGetTodayCheckin();
  const createCheckin = useCreateCheckin();
  const generateSchedule = useGenerateSchedule();

  const now = new Date();
  const dayOfWeek = now.getDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isMF = dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 4;
  const defaultHasOffice = isWeekday;
  const defaultHasUni = isMF;

  const [hasUni, setHasUni] = useState(defaultHasUni);
  const [hasOffice, setHasOffice] = useState(defaultHasOffice);
  const [officeHours, setOfficeHours] = useState("9am – 3pm");
  const [uniHours, setUniHours] = useState("3pm – 9pm");
  const [commitments, setCommitments] = useState<string[]>([]);
  const [otherCommitment, setOtherCommitment] = useState("");
  const [availableHours, setAvailableHours] = useState(3);
  const [yesterdayWork, setYesterdayWork] = useState("");
  const [tasks, setTasks] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiSchedule, setAiSchedule] = useState<any>(null);

  const toggleCommitment = (c: string) =>
    setCommitments((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tasks.trim()) {
      toast({ title: "Input Required", description: "What's your plan for today?", variant: "destructive" });
      return;
    }

    const commitmentStr = [
      ...commitments,
      ...(otherCommitment ? [otherCommitment] : []),
    ].join(", ");

    try {
      await createCheckin.mutateAsync({ data: { hasUni, hasOffice, tasks, availableHours } });

      const scheduleRes = await generateSchedule.mutateAsync({
        data: {
          hasUni,
          hasOffice,
          tasks,
          availableHours,
          currentPhase: "Phase 1: Backend + Voice AI Foundations",
          yesterdayWork: yesterdayWork || undefined,
          officeHours: hasOffice ? officeHours : undefined,
          uniHours: hasUni ? uniHours : undefined,
          commitments: commitmentStr || undefined,
        },
      });

      setAiSchedule(scheduleRes);
      toast({
        title: "CHECK-IN LOGGED",
        description: "AI schedule generated.",
        className: "bg-primary border-primary text-primary-foreground font-mono",
      });
    } catch {
      toast({ title: "Error", description: "Failed to process check-in.", variant: "destructive" });
    }
  };

  const isPending = createCheckin.isPending || generateSchedule.isPending;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
      <header className="border-b border-border pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-mono font-bold text-white flex items-center gap-3">
              <CheckSquare className="w-6 h-6" />
              Daily Check-in
            </h1>
            <p className="text-muted-foreground font-mono text-sm mt-1">{format(now, "EEEE, MMMM do, yyyy")}</p>
          </div>
          {todayCheckin && !checkinLoading && (
            <span className="px-3 py-1 border border-border text-muted-foreground text-xs font-mono rounded-full">
              Already logged today
            </span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Yesterday */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              What did you accomplish yesterday?
            </label>
            <textarea
              value={yesterdayWork}
              onChange={(e) => setYesterdayWork(e.target.value)}
              placeholder="e.g., finished ep 25, built auth middleware, read LangChain docs..."
              className="w-full h-24 bg-secondary/50 border border-border rounded-lg p-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/30 resize-none transition-colors"
            />
          </div>

          {/* Today's Schedule */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Today's Schedule
            </h3>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHasOffice(!hasOffice)}
                className={`flex-1 py-2.5 rounded-lg border font-mono text-sm transition-all ${
                  hasOffice
                    ? "bg-white text-black border-white"
                    : "bg-secondary border-border text-muted-foreground hover:border-white/20"
                }`}
              >
                Office
              </button>
              <button
                type="button"
                onClick={() => setHasUni(!hasUni)}
                className={`flex-1 py-2.5 rounded-lg border font-mono text-sm transition-all ${
                  hasUni
                    ? "bg-white text-black border-white"
                    : "bg-secondary border-border text-muted-foreground hover:border-white/20"
                }`}
              >
                University
              </button>
            </div>

            {(hasOffice || hasUni) && (
              <div className="space-y-2">
                {hasOffice && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-16">Office</span>
                    <input
                      type="text"
                      value={officeHours}
                      onChange={(e) => setOfficeHours(e.target.value)}
                      className="flex-1 bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:border-white/30"
                      placeholder="9am – 3pm"
                    />
                  </div>
                )}
                {hasUni && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-16">Uni</span>
                    <input
                      type="text"
                      value={uniHours}
                      onChange={(e) => setUniHours(e.target.value)}
                      className="flex-1 bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:border-white/30"
                      placeholder="3pm – 9pm"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Available Hours */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">Available for coding</span>
                <span className="text-sm font-mono font-bold text-white">{availableHours}h</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={availableHours}
                onChange={(e) => setAvailableHours(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground/50">
                <span>0.5h</span><span>5h</span><span>10h</span>
              </div>
            </div>
          </div>

          {/* Other Commitments */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-xs font-mono text-muted-foreground uppercase tracking-wider"
            >
              <span>Other Commitments Today</span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showAdvanced && (
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap gap-2">
                  {COMMITMENT_OPTIONS.slice(0, -1).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCommitment(c)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                        commitments.includes(c)
                          ? "bg-white text-black border-white"
                          : "bg-secondary border-border text-muted-foreground hover:border-white/20"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={otherCommitment}
                  onChange={(e) => setOtherCommitment(e.target.value)}
                  placeholder="Anything else? (assignment, family event...)"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/30"
                />
              </div>
            )}
          </div>

          {/* Today's Plan */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              What's your plan for today?
            </label>
            <textarea
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              placeholder="e.g., finish ep 26, review JWT notes, push to GitHub..."
              className="w-full h-28 bg-secondary/50 border border-border rounded-lg p-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/30 resize-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 bg-white text-black font-mono font-bold rounded-xl hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> GENERATING...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> GENERATE SCHEDULE</>
            )}
          </button>
        </form>

        {/* AI Output */}
        <div>
          {aiSchedule ? (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-border rounded-xl p-6 space-y-5"
            >
              <h2 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4" />
                AI Schedule
              </h2>

              <div className="p-4 bg-secondary/50 rounded-lg border border-border/50 text-sm font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {aiSchedule.schedule}
              </div>

              <div>
                <h3 className="text-xs font-mono font-bold text-white mb-2 uppercase tracking-wider">Action Items</h3>
                <ul className="space-y-2">
                  {aiSchedule.tasks.map((task: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-mono">
                      <div className="mt-1 w-3.5 h-3.5 rounded border border-border flex-shrink-0" />
                      <span className="text-foreground/90">{task}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-secondary border border-border rounded-lg p-3">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Pomodoro</p>
                <p className="text-sm font-mono text-white">{aiSchedule.pomodoroRecommendation}</p>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border border-dashed border-border rounded-xl p-8 text-center min-h-[400px]">
              <Bot className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="font-mono text-muted-foreground text-sm">
                Fill in your day context<br />to generate an AI schedule.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
