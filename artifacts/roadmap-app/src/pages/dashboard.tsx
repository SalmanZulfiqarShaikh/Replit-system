import { motion } from "framer-motion";
import { Flame, Clock, PlayCircle, Timer, Activity, Award, TrendingUp, Play, ExternalLink, CheckSquare2 } from "lucide-react";
import { useGetProgressStats, useGetHoursLog, useGetUserProfile, useGetEpisodeProgress, useGetTodayCheckin } from "@workspace/api-client-react";
import { Heatmap } from "@/components/heatmap";
import { ROADMAP_PHASES } from "@/lib/roadmap-data";
import { Link } from "wouter";

function useNowPlaying(completedIds: Set<string>) {
  for (const phase of ROADMAP_PHASES) {
    if (phase.isBlackout || phase.episodes.length === 0) continue;
    for (const ep of phase.episodes) {
      if (!completedIds.has(ep.id)) {
        return { episode: ep, phase };
      }
    }
  }
  return null;
}

function parseTasks(aiSchedule: string | null | undefined): string[] {
  if (!aiSchedule) return [];
  const tasksMatch = aiSchedule.match(/TASKS:\n([\s\S]*?)(?:\n\nPOMODORO:|$)/);
  const tasksText = tasksMatch?.[1] || "";
  return tasksText
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l) => l.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetProgressStats();
  const { data: hoursLog, isLoading: hoursLoading } = useGetHoursLog({ days: 180 });
  const { data: profile } = useGetUserProfile();
  const { data: completedEpisodes } = useGetEpisodeProgress();
  const { data: todayCheckin } = useGetTodayCheckin();

  const completedIds = new Set(completedEpisodes?.map(e => e.episodeId) || []);
  const nowPlaying = useNowPlaying(completedIds);
  const todayTasks = parseTasks(todayCheckin?.aiSchedule);

  const currentHours = stats?.hoursThisWeek || 0;
  const targetHours = 20;
  const progressPercent = Math.min(100, Math.round((currentHours / targetHours) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
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
        <StatCard icon={<Flame className="w-4 h-4" />} title="Streak" value={`${stats?.currentStreak || 0}d`} loading={statsLoading} />
        <StatCard icon={<Clock className="w-4 h-4" />} title="Total Hours" value={`${stats?.totalHours || 0}h`} loading={statsLoading} />
        <StatCard icon={<PlayCircle className="w-4 h-4" />} title="Episodes" value={stats?.totalEpisodes?.toString() || "0"} loading={statsLoading} />
        <StatCard icon={<Timer className="w-4 h-4" />} title="Pomodoros" value={stats?.totalPomodoros?.toString() || "0"} loading={statsLoading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Now Playing */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Play className="w-3.5 h-3.5" />
            Now Playing
          </h2>
          {nowPlaying ? (
            <div className="space-y-3">
              <div className="p-4 bg-secondary/50 rounded-lg border border-border/50">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
                  {nowPlaying.phase.title}
                </p>
                <p className="font-mono text-white font-bold text-sm leading-tight">
                  {nowPlaying.episode.title}
                </p>
              </div>
              <div className="flex gap-2">
                {nowPlaying.episode.url ? (
                  <a
                    href={nowPlaying.episode.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-black font-mono text-xs font-bold hover:bg-white/90 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Watch Now
                  </a>
                ) : null}
                <Link href="/progress" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-muted-foreground font-mono text-xs hover:border-white/20 hover:text-white transition-all">
                  View All
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm font-mono text-muted-foreground">All episodes complete!</p>
            </div>
          )}
        </div>

        {/* Today's Mission */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <CheckSquare2 className="w-3.5 h-3.5" />
            Today's Mission
          </h2>
          {todayTasks.length > 0 ? (
            <ul className="space-y-2">
              {todayTasks.map((task, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm font-mono">
                  <div className="mt-1.5 w-3 h-3 rounded border border-border flex-shrink-0" />
                  <span className="text-foreground/90 leading-snug">{task}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm font-mono text-muted-foreground mb-3">No schedule generated yet.</p>
              <Link href="/checkin" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-xs font-mono text-muted-foreground hover:border-white/20 hover:text-white transition-all">
                Do Check-in →
              </Link>
            </div>
          )}
        </div>
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
              <span key={i} className="px-3 py-1.5 text-xs font-mono bg-white/5 text-white border border-border rounded-full">
                {badge}
              </span>
            ))
          ) : (
            <p className="text-sm text-muted-foreground font-mono">No achievements yet. Complete tasks to unlock.</p>
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
