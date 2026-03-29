import { motion } from "framer-motion";
import { Flame, Clock, PlayCircle, Trophy, Activity, Medal, Timer } from "lucide-react";
import { useGetProgressStats, useGetHoursLog, useGetUserProfile } from "@workspace/api-client-react";
import { Heatmap } from "@/components/heatmap";
import { LEADERBOARD } from "@/lib/roadmap-data";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetProgressStats();
  const { data: hoursLog, isLoading: hoursLoading } = useGetHoursLog({ days: 180 });
  const { data: profile } = useGetUserProfile();

  const currentHours = stats?.hoursThisWeek || 0;
  const targetHours = 40; // Example weekly target
  const progressPercent = Math.min(100, Math.round((currentHours / targetHours) * 100));

  // Update leaderboard with actual user hours
  const displayLeaderboard = LEADERBOARD.map(entry => 
    entry.isUser ? { ...entry, hours: currentHours } : entry
  ).sort((a, b) => b.hours - a.hours).map((entry, index) => ({ ...entry, rank: index + 1 }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-3xl md:text-4xl font-mono font-bold text-white mb-2">
          SYSTEM_STATUS: <span className="text-primary glow-primary">ONLINE</span>
        </h1>
        <p className="text-muted-foreground font-mono">Welcome back, {profile?.firstName || 'Developer'}. Phase 1 execution active.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<Flame className="w-5 h-5 text-orange-500" />} 
          title="Current Streak" 
          value={`${stats?.currentStreak || 0} Days`} 
          loading={statsLoading}
          highlight
        />
        <StatCard 
          icon={<Clock className="w-5 h-5 text-blue-400" />} 
          title="Total Hours" 
          value={`${stats?.totalHours || 0}h`} 
          loading={statsLoading}
        />
        <StatCard 
          icon={<PlayCircle className="w-5 h-5 text-purple-400" />} 
          title="Episodes Done" 
          value={stats?.totalEpisodes?.toString() || "0"} 
          loading={statsLoading}
        />
        <StatCard 
          icon={<Timer className="w-5 h-5 text-red-400" />} 
          title="Pomodoros" 
          value={stats?.totalPomodoros?.toString() || "0"} 
          loading={statsLoading}
        />
      </div>

      {/* Weekly Progress Bar */}
      <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-lg font-mono font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Weekly Output
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Target: {targetHours}h / week</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold font-mono text-primary">{currentHours}h</span>
              <span className="text-muted-foreground text-sm font-mono ml-1">/ {targetHours}h</span>
            </div>
          </div>
          
          <div className="w-full h-4 bg-secondary rounded-full overflow-hidden border border-border/50 p-0.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-primary rounded-full relative"
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </motion.div>
          </div>
          <p className="text-xs text-right mt-2 text-muted-foreground font-mono">{progressPercent}% Capacity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Section */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-mono font-bold text-white mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Contribution Matrix
          </h2>
          {hoursLoading ? (
            <div className="h-[120px] flex items-center justify-center text-muted-foreground font-mono animate-pulse">Loading matrix...</div>
          ) : (
            <Heatmap data={hoursLog || []} days={180} />
          )}
        </div>

        {/* Leaderboard & Achievements */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-mono font-bold text-white mb-4 flex items-center gap-2">
              <Medal className="w-5 h-5 text-primary" />
              Global Leaderboard
            </h2>
            <div className="space-y-3">
              {displayLeaderboard.map((entry) => (
                <div 
                  key={entry.name} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    entry.isUser 
                      ? "bg-primary/10 border-primary/30 text-primary" 
                      : "bg-secondary/50 border-border/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3 font-mono">
                    <span className="font-bold opacity-70">#{entry.rank}</span>
                    <span className={entry.isUser ? "text-white font-bold" : "text-foreground"}>
                      {entry.name}
                    </span>
                  </div>
                  <span className="font-mono font-bold">{entry.hours}h</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-mono font-bold text-white mb-4">Badges</h2>
            <div className="flex flex-wrap gap-2">
              {profile?.achievements?.length ? profile.achievements.map((badge, i) => (
                <span key={i} className="px-3 py-1.5 text-xs font-mono bg-primary/20 text-primary border border-primary/30 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {badge}
                </span>
              )) : (
                <span className="text-sm text-muted-foreground font-mono">No badges yet. Execute tasks to unlock.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, title, value, highlight, loading }: any) {
  return (
    <div className={`bg-card border rounded-xl p-5 relative overflow-hidden group hover:border-primary/50 transition-colors ${highlight ? 'border-primary/30' : 'border-border'}`}>
      {highlight && <div className="absolute inset-0 bg-primary/5" />}
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-secondary rounded-lg border border-border">
            {icon}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-secondary animate-pulse rounded mt-1" />
          ) : (
            <h3 className={`text-2xl font-bold font-mono mt-1 ${highlight ? 'text-primary' : 'text-white'}`}>{value}</h3>
          )}
        </div>
      </div>
    </div>
  );
}

