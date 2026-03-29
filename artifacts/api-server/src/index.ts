import app from "./app";
import { logger } from "./lib/logger";
import cron from "node-cron";
import { db } from "@workspace/db";
import { userProfilesTable } from "@workspace/db/schema";
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

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
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
