import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, userProfilesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { UpdateUserProfileBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/user/profile", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
  let [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.id, req.user.id));

  if (!profile) {
    [profile] = await db
      .insert(userProfilesTable)
      .values({ id: req.user.id })
      .returning();
  }

  res.json({
    id: req.user.id,
    username: user?.email || user?.firstName || req.user.id,
    firstName: user?.firstName || "",
    currentPhase: profile.currentPhase,
    totalHoursLogged: profile.totalHoursLogged,
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    lastCheckIn: profile.lastCheckIn || null,
    achievements: profile.achievements || [],
  });
});

router.patch("/user/profile", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const body = UpdateUserProfileBody.parse(req.body);

  let [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.id, req.user.id));
  if (!profile) {
    [profile] = await db.insert(userProfilesTable).values({ id: req.user.id }).returning();
  }

  const updates: Partial<typeof profile> = { updatedAt: new Date() };
  if (body.currentPhase !== undefined) updates.currentPhase = body.currentPhase;

  const [updated] = await db
    .update(userProfilesTable)
    .set(updates)
    .where(eq(userProfilesTable.id, req.user.id))
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));

  res.json({
    id: req.user.id,
    username: user?.email || user?.firstName || req.user.id,
    firstName: user?.firstName || "",
    currentPhase: updated.currentPhase,
    totalHoursLogged: updated.totalHoursLogged,
    currentStreak: updated.currentStreak,
    longestStreak: updated.longestStreak,
    lastCheckIn: updated.lastCheckIn || null,
    achievements: updated.achievements || [],
  });
});

export default router;
