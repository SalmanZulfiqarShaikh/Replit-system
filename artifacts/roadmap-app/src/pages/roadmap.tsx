import { motion } from "framer-motion";
import { Map, ExternalLink, Code2, Calendar } from "lucide-react";
import { ROADMAP_PHASES } from "@/lib/roadmap-data";

export default function Roadmap() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <header className="border-b border-border/50 pb-6 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px] -z-10" />
        <h1 className="text-3xl font-mono font-bold text-white flex items-center gap-3">
          <Map className="text-primary w-8 h-8" />
          Master Protocol
        </h1>
        <p className="text-muted-foreground font-mono mt-2">10-Month AI Engineering Masterplan. Read-only view.</p>
      </header>

      <div className="relative border-l-2 border-border ml-4 md:ml-6 space-y-12 pb-12">
        {ROADMAP_PHASES.map((phase, i) => (
          <div key={phase.id} className="relative pl-8 md:pl-12">
            {/* Timeline dot */}
            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${
              phase.isBlackout ? 'bg-background border-red-500/60' : 'bg-white border-white'
            }`} />

            <div className={`bg-card border rounded-xl p-6 ${phase.isBlackout ? 'border-red-500/30 bg-red-500/5' : 'border-border'}`}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold font-mono text-white">{phase.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground font-mono">
                    <Calendar className="w-4 h-4" />
                    {phase.duration}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {phase.skills.map(skill => (
                    <span key={skill} className={`px-2 py-1 text-xs font-mono border rounded bg-secondary/50 ${
                      phase.isBlackout ? 'border-red-500/20 text-red-400' : 'border-border text-foreground'
                    }`}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {!phase.isBlackout && phase.resources.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border/50">
                  <h4 className="text-xs font-bold font-mono text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Code2 className="w-4 h-4" /> Required Resources
                  </h4>
                  <div className="space-y-2">
                    {phase.resources.map(res => (
                      <a 
                        key={res.name}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary hover:border-primary/50 transition-colors group"
                      >
                        <span className="font-mono text-sm text-foreground/90 group-hover:text-white transition-colors">
                          {res.name}
                        </span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
