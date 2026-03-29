import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  episodeProgressTable,
  dailyCheckinsTable,
  userProfilesTable,
  pomodoroSessionsTable,
} from "@workspace/db/schema";
import { eq, desc, gte, and } from "drizzle-orm";
import { LogEpisodeCompletionBody, GetHoursLogQueryParams, RemoveEpisodeCompletionParams } from "@workspace/api-zod";

const router: IRouter = Router();

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

router.get("/progress/episodes", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const episodes = await db
    .select()
    .from(episodeProgressTable)
    .where(eq(episodeProgressTable.userId, req.user.id))
    .orderBy(desc(episodeProgressTable.completedAt));
  res.json(episodes);
});

router.post("/progress/episodes", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const body = LogEpisodeCompletionBody.parse(req.body);

  const [existing] = await db
    .select()
    .from(episodeProgressTable)
    .where(
      and(
        eq(episodeProgressTable.userId, req.user.id),
        eq(episodeProgressTable.episodeId, body.episodeId)
      )
    );

  if (existing) {
    res.json(existing);
    return;
  }

  const [episode] = await db
    .insert(episodeProgressTable)
    .values({
      userId: req.user.id,
      episodeId: body.episodeId,
      episodeTitle: body.episodeTitle,
      phase: body.phase,
    })
    .returning();

  const allEpisodes = await db
    .select()
    .from(episodeProgressTable)
    .where(eq(episodeProgressTable.userId, req.user.id));

  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.id, req.user.id));
  if (profile) {
    const achievements = [...profile.achievements];
    if (allEpisodes.length >= 10 && !achievements.includes("Episode 10")) achievements.push("Episode 10");
    await db
      .update(userProfilesTable)
      .set({ achievements, updatedAt: new Date() })
      .where(eq(userProfilesTable.id, req.user.id));
  }

  res.json(episode);
});

router.delete("/progress/episodes/:episodeId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { episodeId } = RemoveEpisodeCompletionParams.parse(req.params);
  await db
    .delete(episodeProgressTable)
    .where(
      and(
        eq(episodeProgressTable.userId, req.user.id),
        eq(episodeProgressTable.episodeId, episodeId)
      )
    );
  res.json({ success: true });
});

router.get("/progress/hours", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const query = GetHoursLogQueryParams.parse(req.query);
  const days = query.days || 180;
  const startDate = getDateDaysAgo(days);

  const checkins = await db
    .select()
    .from(dailyCheckinsTable)
    .where(
      and(
        eq(dailyCheckinsTable.userId, req.user.id),
        gte(dailyCheckinsTable.date, startDate)
      )
    );

  const result = checkins.map((c) => ({
    date: c.date,
    hours: c.hoursLogged,
    sessions: c.pomodoroSessions,
  }));

  res.json(result);
});

router.get("/progress/stats", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.id, req.user.id));

  const weekStart = getDateDaysAgo(7);
  const monthStart = getDateDaysAgo(30);

  const weekCheckins = await db
    .select()
    .from(dailyCheckinsTable)
    .where(
      and(
        eq(dailyCheckinsTable.userId, req.user.id),
        gte(dailyCheckinsTable.date, weekStart)
      )
    );

  const monthCheckins = await db
    .select()
    .from(dailyCheckinsTable)
    .where(
      and(
        eq(dailyCheckinsTable.userId, req.user.id),
        gte(dailyCheckinsTable.date, monthStart)
      )
    );

  const allEpisodes = await db
    .select()
    .from(episodeProgressTable)
    .where(eq(episodeProgressTable.userId, req.user.id));

  const allPomodoros = await db
    .select()
    .from(pomodoroSessionsTable)
    .where(eq(pomodoroSessionsTable.userId, req.user.id));

  const hoursThisWeek = weekCheckins.reduce((sum, c) => sum + c.hoursLogged, 0);
  const hoursThisMonth = monthCheckins.reduce((sum, c) => sum + c.hoursLogged, 0);

  res.json({
    totalHours: profile?.totalHoursLogged || 0,
    currentStreak: profile?.currentStreak || 0,
    longestStreak: profile?.longestStreak || 0,
    totalEpisodes: allEpisodes.length,
    totalPomodoros: allPomodoros.length,
    hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
    hoursThisMonth: Math.round(hoursThisMonth * 10) / 10,
    lastCheckIn: profile?.lastCheckIn || null,
  });
});

export default router;
