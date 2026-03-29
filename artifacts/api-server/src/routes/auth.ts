import { Router, type IRouter, type Request, type Response } from "express";
import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import { db, usersTable, userProfilesTable } from "@workspace/db";
import {
  clearSession,
  getSessionId,
  createSession,
  deleteSession,
  verifyPassword,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();

const SALMAN_USER = {
  id: "salman-001",
  email: "ss3000569@gmail.com",
  firstName: "Salman",
  lastName: "Zulfiqar",
  profileImageUrl: null as string | null,
};

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

async function ensureUserExists() {
  await db
    .insert(usersTable)
    .values(SALMAN_USER)
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        email: SALMAN_USER.email,
        firstName: SALMAN_USER.firstName,
        lastName: SALMAN_USER.lastName,
        updatedAt: new Date(),
      },
    });

  await db
    .insert(userProfilesTable)
    .values({ id: SALMAN_USER.id })
    .onConflictDoNothing();
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.post("/login", async (req: Request, res: Response) => {
  const { password } = req.body || {};

  if (!password || !verifyPassword(password)) {
    res.status(401).json({ error: "Wrong password" });
    return;
  }

  await ensureUserExists();

  const sessionData: SessionData = { user: SALMAN_USER };
  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);

  res.json({ user: SALMAN_USER });
});

router.get("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.redirect("/");
});

router.post("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  if (sid) await deleteSession(sid);
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ success: true });
});

export default router;
