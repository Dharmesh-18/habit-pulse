// convex/reports/cohereClient.ts
import type { AggregatedHabitStats } from "./aggregator";

export interface HabitCoachInsight {
  habitTitle: string;
  statusTag: "Strong" | "Building" | "Needs Focus";
  advice: string;
}

export interface AiCoachingAnalysis {
  source: "cohere" | "fallback";
  executiveSummary: string;
  streakDiagnosis: string;
  habitInsights: HabitCoachInsight[];
  actionPlan: string[];
}

function buildDeterministicFallback(
  stats: AggregatedHabitStats
): AiCoachingAnalysis {
  if (stats.habits.length === 0) {
    return {
      source: "fallback",
      executiveSummary:
        "You have not added any active habits yet. Start with 2 to 3 keystone habits to build daily momentum.",
      streakDiagnosis:
        "Consistency compounds when daily friction is low. Anchor new habits to existing morning or evening routines.",
      habitInsights: [],
      actionPlan: [
        "Create 2 small daily habits that take under 5 minutes to complete.",
        "Set fixed reminder times during your highest-energy hours.",
        "Never miss two days in a row—protect the chain even with a minimal effort.",
      ],
    };
  }

  const habitInsights: HabitCoachInsight[] = stats.habits.map((h) => {
    if (h.completionRate >= 80) {
      return {
        habitTitle: h.title,
        statusTag: "Strong",
        advice: `Completed ${h.completedDays}/${h.scheduledDays} days (${h.completionRate}%). Keep your current trigger intact and consider slightly increasing difficulty.`,
      };
    }
    if (h.completionRate >= 45) {
      return {
        habitTitle: h.title,
        statusTag: "Building",
        advice: `Solid ${h.completionRate}% consistency, with drops likely around ${stats.weakestDayOfWeek}. Pair "${h.title}" right after a high-consistency habit.`,
      };
    }
    return {
      habitTitle: h.title,
      statusTag: "Needs Focus",
      advice: `Only ${h.completedDays}/${h.scheduledDays} days logged (${h.completionRate}%). Shrink the daily target by 50% so it feels effortless on busy days.`,
    };
  });

  return {
    source: "fallback",
    executiveSummary: `Across ${stats.activeHabitsCount} active habits, you achieved an overall consistency of ${stats.overallCompletionRate}% (${stats.totalCompletions}/${stats.totalPossible} check-ins). Your peak performance day was ${stats.bestDayOfWeek}.`,
    streakDiagnosis: `Most momentum dips occurred on ${stats.weakestDayOfWeek}. Strengthening your pre-habit trigger on that day will unlock longer uninterrupted streaks.`,
    habitInsights,
    actionPlan: [
      `Protect ${stats.weakestDayOfWeek} by preparing your environment the night before.`,
      `Stack your lowest-rate habit immediately after "${stats.habits[0].title}" (${stats.habits[0].completionRate}%).`,
      "Use a 2-minute minimum rule on low-energy days instead of skipping completely.",
    ],
  };
}

export async function generateCohereCoaching(
  stats: AggregatedHabitStats
): Promise<AiCoachingAnalysis> {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey || stats.habits.length === 0) {
    return buildDeterministicFallback(stats);
  }

  // Anonymized payload: no email, userId, or real name sent to external AI
  const anonymizedPayload = {
    period: stats.periodLabel,
    overallCompletionRate: `${stats.overallCompletionRate}%`,
    totalCompletions: `${stats.totalCompletions}/${stats.totalPossible}`,
    bestDayOfWeek: stats.bestDayOfWeek,
    weakestDayOfWeek: stats.weakestDayOfWeek,
    habits: stats.habits.map((h) => ({
      title: h.title,
      category: h.category,
      reminderTime: h.reminderTime ?? "none",
      completedDays: h.completedDays,
      totalDays: h.scheduledDays,
      completionRate: `${h.completionRate}%`,
      currentStreak: h.currentStreak,
      longestStreak: h.longestStreak,
    })),
  };

  const systemPrompt = [
    "You are an elite behavioral habit coach analyzing a user's habit tracker telemetry.",
    "Return ONLY valid JSON matching this exact schema (no markdown fences, no extra keys):",
    "{",
    '  "executiveSummary": "2-3 concise sentences evaluating overall momentum and consistency.",',
    '  "streakDiagnosis": "1-2 sentences pinpointing streak leaks, day-of-week patterns, or reminder timing gaps.",',
    '  "habitInsights": [',
    '    { "habitTitle": "exact habit title", "statusTag": "Strong" | "Building" | "Needs Focus", "advice": "1-2 concrete, actionable sentences tailored to this habit." }',
    "  ],",
    '  "actionPlan": ["Actionable step 1", "Actionable step 2", "Actionable step 3"]',
    "}",
    "Keep language crisp, practical, encouraging, and ASCII-safe for PDF rendering.",
  ].join("\n");

  try {
    const response = await fetch("https://api.cohere.com/v2/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-a-03-2025",
        temperature: 0.35,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze these habit metrics and generate personalized streak coaching:\n${JSON.stringify(anonymizedPayload)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`Cohere API non-OK (${response.status}):`, errText);
      return buildDeterministicFallback(stats);
    }

    const data = (await response.json()) as {
      message?: { content?: Array<{ type?: string; text?: string }> };
    };

    const rawText = data.message?.content?.[0]?.text;
    if (!rawText) {
      return buildDeterministicFallback(stats);
    }

    const parsed = JSON.parse(rawText) as {
      executiveSummary?: string;
      streakDiagnosis?: string;
      habitInsights?: Array<{
        habitTitle?: string;
        statusTag?: string;
        advice?: string;
      }>;
      actionPlan?: string[];
    };

    if (
      !parsed.executiveSummary ||
      !parsed.streakDiagnosis ||
      !Array.isArray(parsed.habitInsights) ||
      !Array.isArray(parsed.actionPlan)
    ) {
      return buildDeterministicFallback(stats);
    }

    const normalizedInsights: HabitCoachInsight[] = parsed.habitInsights.map(
      (item) => {
        const tag =
          item.statusTag === "Strong" ||
          item.statusTag === "Building" ||
          item.statusTag === "Needs Focus"
            ? item.statusTag
            : "Building";
        return {
          habitTitle: String(item.habitTitle ?? "Habit"),
          statusTag: tag,
          advice: String(item.advice ?? ""),
        };
      }
    );

    return {
      source: "cohere",
      executiveSummary: parsed.executiveSummary,
      streakDiagnosis: parsed.streakDiagnosis,
      habitInsights: normalizedInsights,
      actionPlan: parsed.actionPlan.slice(0, 4).map(String),
    };
  } catch (err) {
    console.warn("Cohere coaching call failed, using fallback:", err);
    return buildDeterministicFallback(stats);
  }
}