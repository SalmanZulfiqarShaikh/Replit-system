import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  dailyCheckinsTable,
  episodeProgressTable,
  userProfilesTable,
} from "@workspace/db/schema";
import { eq, gte, and, desc } from "drizzle-orm";
import { GenerateScheduleBody } from "@workspace/api-zod";

const router: IRouter = Router();

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content || "";
}

async function callN8nWebhook(payload: Record<string, unknown>): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Non-fatal — don't break the main flow if n8n is down
  }
}

router.post("/ai/schedule", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const body = GenerateScheduleBody.parse(req.body);

  // ─── LLM Memory: last 7 check-ins ────────────────────────────────────────
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const pastCheckins = await db
    .select()
    .from(dailyCheckinsTable)
    .where(
      and(
        eq(dailyCheckinsTable.userId, req.user.id),
        gte(dailyCheckinsTable.date, sevenDaysAgo.toISOString().split("T")[0])
      )
    )
    .orderBy(desc(dailyCheckinsTable.date))
    .limit(7);

  const memoryLines = pastCheckins
    .slice(1) // skip today's checkin (index 0 is today's since we ordered desc)
    .map((c) => {
      const taskSnippet = c.tasks?.slice(0, 120) || "no notes";
      return `  • ${c.date}: ${c.hoursLogged}h logged — "${taskSnippet}"`;
    });

  const memoryBlock = memoryLines.length > 0
    ? `RECENT HISTORY (last ${memoryLines.length} check-ins):\n${memoryLines.join("\n")}\n`
    : "";

  // ─── Today's schedule constraints ─────────────────────────────────────────
  const scheduleLines: string[] = [];
  if (body.hasOffice) scheduleLines.push(`  - Office: ${body.officeHours || "9am–3pm"}`);
  if (body.hasUni) scheduleLines.push(`  - University: ${body.uniHours || "3pm–9pm"}`);
  if (body.commitments) scheduleLines.push(`  - Other commitments: ${body.commitments}`);
  if (scheduleLines.length === 0) scheduleLines.push("  - Free day, no fixed commitments");

  const prompt = `You are an AI accountability coach for a Pakistani developer on a 10-month AI engineering roadmap. Be direct and concise. Casual tone okay (occasional "bhai").

TODAY'S DATE: ${new Date().toDateString()}
CURRENT PHASE: ${body.currentPhase}
AVAILABLE CODING TIME: ${body.availableHours} hours

TODAY'S SCHEDULE:
${scheduleLines.join("\n")}

${memoryBlock}${body.yesterdayWork ? `YESTERDAY'S PROGRESS:\n${body.yesterdayWork}\n` : ""}TODAY'S PLAN (user input):
${body.tasks}

Based on the actual available time window, generate a realistic schedule. Don't suggest coding during office/uni hours. If recent history shows a pattern (skipping, slow progress, momentum), acknowledge it.

Format EXACTLY as:
TASKS:
- [specific task + time estimate]
- [specific task + time estimate]

POMODORO: [e.g. "Start at 9pm — 2x 25min sessions before sleep"]

MOTIVATION: [one punchy sentence based on their recent history]

Max 4 tasks. Be honest if they've been slacking.`;

  try {
    const aiResponse = await callGroq(prompt);

    const tasksMatch = aiResponse.match(/TASKS:\n([\s\S]*?)(?:\n\nPOMODORO:|$)/);
    const pomodoroMatch = aiResponse.match(/POMODORO:\s*(.*?)(?:\n\nMOTIVATION:|$)/s);
    const motivationMatch = aiResponse.match(/MOTIVATION:\s*(.*?)$/s);

    const tasksText = tasksMatch?.[1] || "";
    const tasks = tasksText
      .split("\n")
      .filter((l) => l.trim().startsWith("-"))
      .map((l) => l.replace(/^-\s*/, "").trim())
      .filter(Boolean);

    const pomodoroRecommendation = pomodoroMatch?.[1]?.trim() || "Start sessions in the evening";
    const motivation = motivationMatch?.[1]?.trim() || "You've got this!";

    await db
      .update(dailyCheckinsTable)
      .set({ aiSchedule: aiResponse })
      .where(
        and(
          eq(dailyCheckinsTable.userId, req.user.id),
          eq(dailyCheckinsTable.date, new Date().toISOString().split("T")[0])
        )
      );

    const taskList = tasks.length > 0 ? tasks : ["Focus on your current roadmap phase"];

    // ─── n8n webhook → Gmail notification ─────────────────────────────────
    const today = new Date().toLocaleDateString("en-PK", { weekday: "long", month: "short", day: "numeric" });
    await callN8nWebhook({
      subject: `[SYSTEM.INIT] Your Schedule — ${today}`,
      message: `TASKS FOR TODAY:\n${taskList.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nPOMODORO: ${pomodoroRecommendation}\n\nMOTIVATION: ${motivation}`,
      tasks: taskList,
      pomodoro: pomodoroRecommendation,
      motivation,
      date: today,
    });

    res.json({
      schedule: aiResponse,
      tasks: taskList,
      pomodoroRecommendation: `${pomodoroRecommendation} | ${motivation}`,
    });
  } catch (err) {
    req.log.error({ err }, "AI schedule generation failed");
    res.json({
      schedule: "AI unavailable. Focus on your roadmap tasks for today.",
      tasks: [
        `Continue ${body.currentPhase} materials`,
        "Practice what you learned yesterday",
        "Review any pending exercises",
      ],
      pomodoroRecommendation: "Use 2x 50min sessions with 10min break",
    });
  }
});

router.post("/ai/weekly-report", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const weekCheckins = await db
    .select()
    .from(dailyCheckinsTable)
    .where(
      and(
        eq(dailyCheckinsTable.userId, req.user.id),
        gte(dailyCheckinsTable.date, weekStartStr)
      )
    );

  const weekEpisodes = await db
    .select()
    .from(episodeProgressTable)
    .where(
      and(
        eq(episodeProgressTable.userId, req.user.id),
        gte(episodeProgressTable.completedAt, weekStart)
      )
    );

  const [profile] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.id, req.user.id));

  const hoursLogged = Math.round(weekCheckins.reduce((s, c) => s + c.hoursLogged, 0) * 10) / 10;
  const episodesCompleted = weekEpisodes.length;
  const goalHours = 15;

  const episodeList = weekEpisodes.map((e) => e.episodeTitle).join(", ") || "none";

  const prompt = `You are an AI accountability coach. Be direct and motivating, use casual Pakistani tech bro tone.

Weekly coding stats for the developer:
- Hours coded this week: ${hoursLogged}/${goalHours} target
- Episodes/videos completed: ${episodesCompleted} (${episodeList})
- Current phase: ${profile?.currentPhase || "Phase 1"}
- Current streak: ${profile?.currentStreak || 0} days

Generate a weekly accountability report with:
1. Performance assessment (hit goal? behind? crushed it?)
2. What they accomplished
3. Next week's goal (specific, achievable)
4. Motivational message (direct, personal, no BS)

Keep it under 150 words. Be honest if they underperformed.`;

  try {
    const aiResponse = await callGroq(prompt);

    const nextWeekEpisodeNum = episodesCompleted + 3;
    res.json({
      report: aiResponse,
      hoursLogged,
      episodesCompleted,
      nextWeekGoal: `Log ${goalHours}+ hours and complete ${nextWeekEpisodeNum} more episodes`,
      motivationalMessage: aiResponse.split("\n").slice(-2).join(" ").trim(),
    });
  } catch (err) {
    req.log.error({ err }, "Weekly report generation failed");
    const onTrack = hoursLogged >= goalHours;
    res.json({
      report: onTrack
        ? `Great week! You logged ${hoursLogged} hours — above the ${goalHours}h target. Keep this momentum.`
        : `You logged ${hoursLogged}/${goalHours} hours this week. Make up for it next week. No excuses.`,
      hoursLogged,
      episodesCompleted,
      nextWeekGoal: `Log ${goalHours}+ hours next week`,
      motivationalMessage: onTrack ? "Keep the streak alive!" : "Next week, no distractions.",
    });
  }
});

export default router;
