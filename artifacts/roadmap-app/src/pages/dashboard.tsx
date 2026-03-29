import { motion } from "framer-motion";
import { Flame, Clock, PlayCircle, Timer, Activity, Award, TrendingUp } from "lucide-react";
import { useGetProgressStats, useGetHoursLog, useGetUserProfile } from "@workspace/api-client-react";
import { Heatmap } from "@/components/heatmap";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetProgressStats();
  const { data: hoursLog, isLoading: hoursLoading } = useGetHoursLog({ days: 180 });
  const { data: profile } = useGetUserProfile();

  const currentHours = stats?.hoursThisWeek || 0;
  const targetHours = 20;
  const progressPercent = Math.min(100, Math.round((currentHours / targetHours) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-3xl font-mono font-bold text-white mb-1">
          STATUS: <span className="text-white/50">ONLINE</span>
        </h1>
        <p className="text-muted-foreground font-mono text-sm">
          Welcome back, {profile?.firstName || "Developer"}. Phase 1 active.
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Flame className="w-4 h-4" />}
          title="Streak"
          value={`${stats?.currentStreak || 0}d`}
          loading={statsLoading}
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          title="Total Hours"
          value={`${stats?.totalHours || 0}h`}
          loading={statsLoading}
        />
        <StatCard
          icon={<PlayCircle className="w-4 h-4" />}
          title="Episodes"
          value={stats?.totalEpisodes?.toString() || "0"}
          loading={statsLoading}
        />
        <StatCard
          icon={<Timer className="w-4 h-4" />}
          title="Pomodoros"
          value={stats?.totalPomodoros?.toString() || "0"}
          loading={statsLoading}
        />
      </div>

      {/* Weekly Progress */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-mono font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4" />
              This Week
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">Target: {targetHours}h</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold font-mono text-white">{currentHours}h</span>
            <span className="text-muted-foreground text-sm font-mono ml-1">/ {targetHours}h</span>
          </div>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden border border-border/50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-white rounded-full"
          />
        </div>
        <p className="text-xs text-right mt-2 text-muted-foreground font-mono">{progressPercent}%</p>
      </div>

      {/* Heatmap */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-mono font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Contribution Matrix — 180 Days
        </h2>
        {hoursLoading ? (
          <div className="h-[120px] flex items-center justify-center text-muted-foreground font-mono text-sm animate-pulse">
            Loading...
          </div>
        ) : (
          <Heatmap data={hoursLog || []} days={180} />
        )}
      </div>

      {/* Badges */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-mono font-bold text-white mb-4 flex items-center gap-2">
          <Award className="w-4 h-4" />
          Achievements
        </h2>
        <div className="flex flex-wrap gap-2">
          {profile?.achievements?.length ? (
            profile.achievements.map((badge: string, i: number) => (
              <span
                key={i}
                className="px-3 py-1.5 text-xs font-mono bg-white/5 text-white border border-border rounded-full"
              >
                {badge}
              </span>
            ))
          ) : (
            <p className="text-sm text-muted-foreground font-mono">
              No achievements yet. Complete tasks to unlock.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, title, value, loading }: { icon: React.ReactNode; title: string; value: string; loading?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        {icon}
        <p className="text-xs font-mono uppercase tracking-wider">{title}</p>
      </div>
      {loading ? (
        <div className="h-7 w-14 bg-secondary animate-pulse rounded" />
      ) : (
        <h3 className="text-2xl font-bold font-mono text-white">{value}</h3>
      )}
    </div>
  );
}
