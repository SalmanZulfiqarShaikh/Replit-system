import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Cpu, Target, Award, Loader2 } from "lucide-react";
import { useGenerateWeeklyReport } from "@workspace/api-client-react";

export default function WeeklyReport() {
  const generateReport = useGenerateWeeklyReport();
  const [reportData, setReportData] = useState<any>(null);

  const handleGenerate = async () => {
    try {
      const res = await generateReport.mutateAsync();
      setReportData(res);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-8">
      <header className="border-b border-border/50 pb-6 text-center">
        <h1 className="text-3xl font-mono font-bold text-white flex items-center justify-center gap-3">
          <FileText className="text-primary w-8 h-8" />
          AI Performance Review
        </h1>
        <p className="text-muted-foreground font-mono mt-2">Aggregated weekly data synthesized by AI supervisor.</p>
      </header>

      {!reportData ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-8 relative">
            <div className="absolute inset-0 rounded-full border border-primary/50 animate-ping opacity-20" />
            <Cpu className="w-10 h-10 text-primary" />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generateReport.isPending}
            className="px-8 py-4 bg-primary text-primary-foreground font-mono font-bold rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(29,185,84,0.3)] hover:shadow-[0_0_30px_rgba(29,185,84,0.5)] active:scale-95 flex items-center gap-3 disabled:opacity-50"
          >
            {generateReport.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> SYNTHESIZING DATA...</>
            ) : (
              "COMPILE WEEKLY REPORT"
            )}
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
              <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" /> Next Goal
              </h3>
              <p className="font-mono font-bold text-lg text-white">{reportData.nextWeekGoal}</p>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Award className="w-4 h-4" /> Output
                  </h3>
                  <p className="font-mono text-sm text-foreground/80 mt-2">Hours: <span className="text-white font-bold">{reportData.hoursLogged}</span> | Episodes: <span className="text-white font-bold">{reportData.episodesCompleted}</span></p>
                </div>
                <div className="text-4xl">🔥</div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-primary/30 rounded-xl p-8 relative shadow-[0_0_20px_rgba(29,185,84,0.05)]">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-transparent" />
            <h2 className="text-xl font-mono font-bold text-primary mb-6 flex items-center gap-2">
              <Cpu className="w-6 h-6" /> Executive Summary
            </h2>
            <div className="prose prose-invert prose-p:font-sans prose-p:text-muted-foreground prose-p:leading-relaxed max-w-none">
              <p className="whitespace-pre-wrap">{reportData.report}</p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-border/50">
              <p className="font-mono text-sm text-primary/80 italic">"{reportData.motivationalMessage}"</p>
            </div>
          </div>
          
          <div className="text-center pt-4">
             <button
              onClick={() => setReportData(null)}
              className="text-sm font-mono text-muted-foreground hover:text-primary transition-colors underline decoration-border hover:decoration-primary underline-offset-4"
            >
              Reset View
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
