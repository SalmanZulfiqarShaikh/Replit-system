import { db } from "@workspace/db";
import {
  dailyCheckinsTable,
  episodeProgressTable,
  userProfilesTable,
} from "@workspace/db/schema";
import { eq, gte, and } from "drizzle-orm";
import { logger } from "./logger";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: prompt }], max_tokens: 1024, temperature: 0.7 }),
  });
  if (!res.ok) throw new Error(`Groq error: ${await res.text()}`);
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content || "";
}

export function buildWeeklyReportHtml(report: string, stats: {
  hoursLogged: number;
  episodesCompleted: number;
  goalHours: number;
  nextWeekGoal: string;
  streak: number;
  currentPhase: string;
}): string {
  const hitGoal = stats.hoursLogged >= stats.goalHours;
  const pct = Math.min(100, Math.round((stats.hoursLogged / stats.goalHours) * 100));

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: 'Courier New', monospace; background: #080808; color: #e0e0e0; margin: 0; padding: 24px; }
  .container { max-width: 600px; margin: 0 auto; }
  .header { border-bottom: 1px solid #333; padding-bottom: 16px; margin-bottom: 24px; }
  .title { font-size: 24px; font-weight: bold; color: #fff; letter-spacing: 2px; }
  .subtitle { font-size: 12px; color: #666; margin-top: 4px; }
  .card { background: #111; border: 1px solid #222; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
  .stat-row { display: flex; gap: 16px; margin-bottom: 16px; }
  .stat { flex: 1; text-align: center; }
  .stat-val { font-size: 32px; font-weight: bold; color: ${hitGoal ? '#fff' : '#888'}; }
  .stat-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  .progress-bar { height: 6px; background: #222; border-radius: 3px; overflow: hidden; margin: 8px 0; }
  .progress-fill { height: 100%; background: #fff; border-radius: 3px; width: ${pct}%; }
  .report-text { font-size: 13px; line-height: 1.7; color: #ccc; white-space: pre-wrap; }
  .next-goal { background: #1a1a1a; border-left: 3px solid #fff; padding: 12px 16px; font-size: 13px; color: #ccc; }
  .footer { text-align: center; font-size: 11px; color: #444; margin-top: 24px; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <div class="title">SYSTEM.INIT</div>
    <div class="subtitle">WEEKLY ACCOUNTABILITY REPORT — ${new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
  </div>

  <div class="card">
    <div class="stat-row">
      <div class="stat">
        <div class="stat-val">${stats.hoursLogged}h</div>
        <div class="stat-label">Hours Logged</div>
      </div>
      <div class="stat">
        <div class="stat-val">${stats.episodesCompleted}</div>
        <div class="stat-label">Episodes Done</div>
      </div>
      <div class="stat">
        <div class="stat-val">${stats.streak}d</div>
        <div class="stat-label">Streak</div>
      </div>
    </div>
    <div style="font-size: 11px; color: #666; margin-bottom: 4px;">Weekly target: ${stats.goalHours}h (${pct}% achieved)</div>
    <div class="progress-bar"><div class="progress-fill"></div></div>
  </div>

  <div class="card">
    <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">AI ASSESSMENT</div>
    <div class="report-text">${report}</div>
  </div>

  <div class="next-goal">
    <div style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">NEXT WEEK'S MISSION</div>
    ${stats.nextWeekGoal}
  </div>

  <div style="font-size: 11px; color: #666; margin-top: 16px;">Current phase: ${stats.currentPhase}</div>
  <div class="footer">SYSTEM.INIT · AI Roadmap Accountability</div>
</div>
</body></html>`;
}

export async function generateAndSendWeeklyReport(userId: string): Promise<void> {
  const webhookUrl = process.env.N8N_WEEKLY_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn("N8N_WEEKLY_WEBHOOK_URL not set — skipping weekly report email");
    return;
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const [weekCheckins, weekEpisodes, profileRows] = await Promise.all([
    db.select().from(dailyCheckinsTable).where(
      and(eq(dailyCheckinsTable.userId, userId), gte(dailyCheckinsTable.date, weekStartStr))
    ),
    db.select().from(episodeProgressTable).where(
      and(eq(episodeProgressTable.userId, userId), gte(episodeProgressTable.completedAt, weekStart))
    ),
    db.select().from(userProfilesTable).where(eq(userProfilesTable.id, userId)),
  ]);

  const profile = profileRows[0];
  const hoursLogged = Math.round(weekCheckins.reduce((s, c) => s + c.hoursLogged, 0) * 10) / 10;
  const episodesCompleted = weekEpisodes.length;
  const goalHours = 15;
  const episodeList = weekEpisodes.map(e => e.episodeTitle).join(", ") || "none";

  const prompt = `You are an AI accountability coach. Be direct and motivating, use casual Pakistani tech bro tone.

Weekly coding stats:
- Hours coded: ${hoursLogged}/${goalHours} target
- Episodes completed: ${episodesCompleted} (${episodeList})
- Current phase: ${profile?.currentPhase || "Phase 1"}
- Current streak: ${profile?.currentStreak || 0} days

Write a weekly accountability report (under 150 words). Be honest. If they underperformed, say it. Include:
1. Performance verdict
2. What was accomplished
3. Specific goal for next week
4. One motivational line`;

  let report = "Weekly report unavailable.";
  let nextWeekGoal = `Log ${goalHours}+ hours next week`;
  try {
    report = await callGroq(prompt);
    nextWeekGoal = `Log ${goalHours}+ hours and complete ${episodesCompleted + 3} more episodes`;
  } catch (err) {
    logger.error({ err }, "Groq weekly report generation failed");
  }

  const html = buildWeeklyReportHtml(report, {
    hoursLogged,
    episodesCompleted,
    goalHours,
    nextWeekGoal,
    streak: profile?.currentStreak || 0,
    currentPhase: profile?.currentPhase || "Phase 1",
  });

  const subject = `[SYSTEM.INIT] Weekly Report — ${new Date().toLocaleDateString("en-PK", { month: "short", day: "numeric" })}`;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message: report, html, hoursLogged, episodesCompleted, nextWeekGoal }),
      signal: AbortSignal.timeout(8000),
    });
    logger.info({ userId }, "Weekly report sent to n8n webhook");
  } catch (err) {
    logger.error({ err }, "Failed to call n8n weekly webhook");
  }
}
