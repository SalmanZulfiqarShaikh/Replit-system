import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { dailyCheckinsTable, userProfilesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { CreateCheckinBody } from "@workspace/api-zod";
import { z } from "zod/v4";

const router: IRouter = Router();

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

router.get("/checkin/today", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const today = getTodayDate();
  const [checkin] = await db
    .select()
    .from(dailyCheckinsTable)
    .where(and(eq(dailyCheckinsTable.userId, req.user.id), eq(dailyCheckinsTable.date, today)));

  if (!checkin) {
    res.status(404).json({ error: "No check-in today" });
    return;
  }
  res.json(checkin);
});

router.post("/checkin", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const body = CreateCheckinBody.parse(req.body);
  const today = getTodayDate();

  const [existing] = await db
    .select()
    .from(dailyCheckinsTable)
    .where(and(eq(dailyCheckinsTable.userId, req.user.id), eq(dailyCheckinsTable.date, today)));

  let checkin;
  if (existing) {
    [checkin] = await db
      .update(dailyCheckinsTable)
      .set({
        hasUni: body.hasUni,
        hasOffice: body.hasOffice,
        tasks: body.tasks,
        availableHours: body.availableHours,
        completedTaskIndices: [],
      })
      .where(eq(dailyCheckinsTable.id, existing.id))
      .returning();
  } else {
    [checkin] = await db
      .insert(dailyCheckinsTable)
      .values({
        userId: req.user.id,
        date: today,
        hasUni: body.hasUni,
        hasOffice: body.hasOffice,
        tasks: body.tasks,
        availableHours: body.availableHours,
        completedTaskIndices: [],
      })
      .returning();

    await updateStreakAfterCheckin(req.user.id, today);
  }

  res.json(checkin);
});

const ToggleTaskBody = z.object({
  indices: z.array(z.number().int().min(0)),
});

router.patch("/checkin/tasks", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { indices } = ToggleTaskBody.parse(req.body);
  const today = getTodayDate();

  const [existing] = await db
    .select()
    .from(dailyCheckinsTable)
    .where(and(eq(dailyCheckinsTable.userId, req.user.id), eq(dailyCheckinsTable.date, today)));

  if (!existing) {
    res.status(404).json({ error: "No check-in found for today" });
    return;
  }

  const [updated] = await db
    .update(dailyCheckinsTable)
    .set({ completedTaskIndices: indices })
    .where(eq(dailyCheckinsTable.id, existing.id))
    .returning();

  res.json(updated);
});

async function updateStreakAfterCheckin(userId: string, today: string) {
  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.id, userId));

  if (!profile) {
    await db.insert(userProfilesTable).values({ id: userId }).onConflictDoNothing();
    return;
  }

  const lastDate = profile.lastCheckIn;
  let newStreak = 1;
  if (lastDate) {
    const last = new Date(lastDate);
    const todayD = new Date(today);
    const diffDays = Math.floor((todayD.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      newStreak = profile.currentStreak + 1;
    } else if (diffDays === 0) {
      newStreak = profile.currentStreak;
    }
  }

  const newLongest = Math.max(newStreak, profile.longestStreak);

  const achievements = [...profile.achievements];
  if (newStreak >= 7 && !achievements.includes("Week Warrior")) achievements.push("Week Warrior");
  if (newStreak >= 30 && !achievements.includes("Month Master")) achievements.push("Month Master");
  if (!achievements.includes("First Day")) achievements.push("First Day");

  await db
    .update(userProfilesTable)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastCheckIn: today,
      achievements,
      updatedAt: new Date(),
    })
    .where(eq(userProfilesTable.id, userId));
}

export default router;
