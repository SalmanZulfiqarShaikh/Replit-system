import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  dailyCheckinsTable,
  episodeProgressTable,
  userProfilesTable,
} from "@workspace/db/schema";
import { eq, gte, and } from "drizzle-orm";
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

router.post("/ai/schedule", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const body = GenerateScheduleBody.parse(req.body);

  const constraints = [];
  if (body.hasUni) constraints.push("university classes today");
  if (body.hasOffice) constraints.push("office work today");
  if (body.tasks) constraints.push(`other tasks: ${body.tasks}`);

  const constraintStr = constraints.length > 0 ? constraints.join(", ") : "no other commitments";

  const prompt = `You are an AI accountability coach for a Pakistani developer learning AI engineering. Be direct, motivating, and use casual tone (can use "bhai" occasionally).

User has ${body.availableHours} hours available for coding today.
Constraints: ${constraintStr}
Current roadmap phase: ${body.currentPhase}

Generate a specific, actionable daily coding schedule. Include:
1. Specific tasks to complete today (2-4 tasks max based on hours)
2. Time allocations for each task
3. Pomodoro schedule recommendation (what time to start, how many sessions)
4. A motivational one-liner

Format your response as:
TASKS:
- [task with duration]
- [task with duration]

POMODORO: [specific recommendation like "Start at 8pm, 3x 50min sessions"]

MOTIVATION: [one motivational sentence]

Keep it concise and actionable. No fluff.`;

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

    res.json({
      schedule: aiResponse,
      tasks: tasks.length > 0 ? tasks : ["Focus on your current roadmap phase"],
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
