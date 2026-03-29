import app from "./app";
import { logger } from "./lib/logger";
import cron from "node-cron";
import { db } from "@workspace/db";
import { usersTable, userProfilesTable } from "@workspace/db/schema";
import { generateAndSendWeeklyReport } from "./lib/weekly-report-sender";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const SALMAN = {
  id: "salman-001",
  email: "ss3000569@gmail.com",
  firstName: "Salman",
  lastName: "Zulfiqar",
  profileImageUrl: null as string | null,
};

async function seedUser() {
  try {
    await db
      .insert(usersTable)
      .values(SALMAN)
      .onConflictDoUpdate({
        target: usersTable.id,
        set: { email: SALMAN.email, firstName: SALMAN.firstName, lastName: SALMAN.lastName, updatedAt: new Date() },
      });

    await db
      .insert(userProfilesTable)
      .values({ id: SALMAN.id })
      .onConflictDoNothing();

    logger.info("User seeded OK");
  } catch (err) {
    logger.error({ err }, "Failed to seed user — DB connection may be down");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  await seedUser();
});

// Every Sunday at 8:00 PM PKT (UTC+5 → 3pm UTC = 15:00 UTC on Sunday)
cron.schedule("0 15 * * 0", async () => {
  logger.info("Sunday cron: generating weekly reports");
  try {
    const users = await db.select({ id: userProfilesTable.id }).from(userProfilesTable);
    for (const user of users) {
      await generateAndSendWeeklyReport(user.id);
    }
    logger.info({ count: users.length }, "Weekly reports sent");
  } catch (err) {
    logger.error({ err }, "Sunday cron job failed");
  }
}, { timezone: "Asia/Karachi" });
