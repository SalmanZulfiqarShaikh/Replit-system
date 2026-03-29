import { motion } from "framer-motion";
import { TrendingUp, CheckCircle2, Circle, Lock } from "lucide-react";
import { useGetEpisodeProgress, useLogEpisodeCompletion, useRemoveEpisodeCompletion } from "@workspace/api-client-react";
import { ROADMAP_PHASES } from "@/lib/roadmap-data";
import { useToast } from "@/hooks/use-toast";

export default function Progress() {
  const { data: completedEpisodes, refetch } = useGetEpisodeProgress();
  const logEpisode = useLogEpisodeCompletion();
  const removeEpisode = useRemoveEpisodeCompletion();
  const { toast } = useToast();

  const completedIds = new Set(completedEpisodes?.map(e => e.episodeId) || []);

  const handleToggle = async (episodeId: string, title: string, phase: string, isCompleted: boolean) => {
    try {
      if (isCompleted) {
        await removeEpisode.mutateAsync({ episodeId });
      } else {
        await logEpisode.mutateAsync({ data: { episodeId, episodeTitle: title, phase } });
        toast({
          title: "PROGRESS LOGGED",
          description: title,
          className: "bg-primary border-primary text-primary-foreground font-mono"
        });
      }
      refetch(); // Invalidate cache manually since orval hooks might need explicit refetch if keys are tricky
    } catch (e) {
      toast({ title: "Error updating progress", variant: "destructive" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <header className="border-b border-border/50 pb-6">
        <h1 className="text-3xl font-mono font-bold text-white flex items-center gap-3">
          <TrendingUp className="text-primary w-8 h-8" />
          Execution Log
        </h1>
        <p className="text-muted-foreground font-mono mt-2">Track your progress through the AI engineering syllabus.</p>
      </header>

      <div className="space-y-12">
        {ROADMAP_PHASES.map((phase, index) => {
          if (phase.isBlackout) {
            return (
              <div key={phase.id} className="relative bg-secondary/20 border border-dashed border-red-500/30 rounded-xl p-8 flex flex-col items-center justify-center text-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAiPjwvcmVjdD4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiNmZjAwMDAiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-50" />
                <Lock className="w-8 h-8 text-red-500/50 mb-3 relative z-10" />
                <h3 className="text-lg font-mono font-bold text-red-400 relative z-10">{phase.title}</h3>
                <p className="text-sm font-mono text-muted-foreground mt-1 relative z-10">{phase.duration}</p>
              </div>
            );
          }

          const phaseCompletedCount = phase.episodes.filter(e => completedIds.has(e.id)).length;
          const phaseTotal = phase.episodes.length;
          const isPhaseDone = phaseTotal > 0 && phaseCompletedCount === phaseTotal;

          return (
            <div key={phase.id} className="bg-card border border-border rounded-xl overflow-hidden relative group">
              {/* Phase Header */}
              <div className={`p-6 border-b border-border/50 ${isPhaseDone ? 'bg-primary/5' : 'bg-secondary/30'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-mono text-primary border border-primary/30 bg-primary/10 px-2 py-1 rounded">Phase {index + 1}</span>
                    <h2 className="text-xl font-bold font-mono text-white mt-3">{phase.title}</h2>
                    <p className="text-sm text-muted-foreground font-mono mt-1">{phase.duration}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-white">{phaseCompletedCount}</span>
                    <span className="text-muted-foreground font-mono">/{phaseTotal}</span>
                  </div>
                </div>

                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${phaseTotal === 0 ? 0 : (phaseCompletedCount / phaseTotal) * 100}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>

              {/* Episode List */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {phase.episodes.map(ep => {
                  const isDone = completedIds.has(ep.id);
                  return (
                    <div 
                      key={ep.id}
                      onClick={() => handleToggle(ep.id, ep.title, phase.id, isDone)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isDone 
                          ? 'bg-primary/10 border-primary/30 text-white shadow-[inset_0_0_10px_rgba(29,185,84,0.1)]' 
                          : 'bg-secondary/50 border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 flex-shrink-0 opacity-50" />
                      )}
                      <span className={`font-mono text-sm truncate ${isDone ? 'line-through opacity-80' : ''}`}>
                        {ep.title}
                      </span>
                    </div>
                  );
                })}
                {phase.episodes.length === 0 && (
                  <div className="col-span-full py-4 text-center text-sm font-mono text-muted-foreground/50">
                    No specific episodes tracked. Project-based phase.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
