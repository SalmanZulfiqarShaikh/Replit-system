import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { pomodoroSessionsTable, dailyCheckinsTable, userProfilesTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { CreatePomodoroSessionBody, GetPomodoroSessionsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

router.get("/pomodoro/sessions", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const query = GetPomodoroSessionsQueryParams.parse(req.query);
  const limit = query.limit || 20;

  const sessions = await db
    .select()
    .from(pomodoroSessionsTable)
    .where(eq(pomodoroSessionsTable.userId, req.user.id))
    .orderBy(desc(pomodoroSessionsTable.completedAt))
    .limit(limit);

  res.json(sessions);
});

router.post("/pomodoro/sessions", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const body = CreatePomodoroSessionBody.parse(req.body);
  const today = getTodayDate();

  const [session] = await db
    .insert(pomodoroSessionsTable)
    .values({
      userId: req.user.id,
      date: today,
      workDuration: body.workDuration,
      breakDuration: body.breakDuration,
    })
    .returning();

  const hoursAdded = body.workDuration / 60;

  const [existing] = await db
    .select()
    .from(dailyCheckinsTable)
    .where(and(eq(dailyCheckinsTable.userId, req.user.id), eq(dailyCheckinsTable.date, today)));

  if (existing) {
    await db
      .update(dailyCheckinsTable)
      .set({
        pomodoroSessions: existing.pomodoroSessions + 1,
        hoursLogged: existing.hoursLogged + hoursAdded,
      })
      .where(eq(dailyCheckinsTable.id, existing.id));
  }

  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.id, req.user.id));
  if (profile) {
    const newTotal = profile.totalHoursLogged + hoursAdded;
    const achievements = [...profile.achievements];
    if (newTotal >= 50 && !achievements.includes("50 Hours")) achievements.push("50 Hours");
    if (newTotal >= 100 && !achievements.includes("100 Hours")) achievements.push("100 Hours");

    const todaySessions = await db
      .select()
      .from(pomodoroSessionsTable)
      .where(eq(pomodoroSessionsTable.userId, req.user.id));
    if (todaySessions.length >= 25 && !achievements.includes("Pomodoro Pro")) achievements.push("Pomodoro Pro");

    await db
      .update(userProfilesTable)
      .set({ totalHoursLogged: newTotal, achievements, updatedAt: new Date() })
      .where(eq(userProfilesTable.id, req.user.id));
  }

  res.json(session);
});

export default router;
