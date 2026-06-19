import { SCENARIOS } from "../../lib/scenarios";
import { calcAura } from "../../lib/game-logic";
import type { StatBlock } from "../../lib/archetypes";
import type { ScenarioDifficulty } from "../../lib/scenarios";

const MODEL = "meta-llama/llama-3.1-8b-instruct";

const MODEL_CONFIG: Record<ScenarioDifficulty, { temperature: number }> = {
  easy:   { temperature: 0.5 },
  medium: { temperature: 0.8 },
  hard:   { temperature: 1.0 },
};

const OR_BASE = "https://openrouter.ai/api/v1/chat/completions";

type LifeRequest = {
  phase: "chat" | "resolve";
  scenarioId: string;
  difficulty: ScenarioDifficulty;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  closer?: "own-it" | "play-it-cool" | "sidestep";
  totalScore?: number;
  streak?: number;
  stats?: StatBlock;
};

function safeParseJSON(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENROUTER_API_KEY not set" }, { status: 500 });
  }

  try {
    const body = (await req.json()) as LifeRequest;
    const { phase, scenarioId, difficulty, messages, closer, totalScore, streak, stats } = body;

    const { temperature } = MODEL_CONFIG[difficulty] ?? MODEL_CONFIG.easy;
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);

    if (!scenario) {
      return new Response("...\n[SCORE: 0]", { status: 200 });
    }

    // ── CHAT (streaming) ──────────────────────────────────────────────────────
    if (phase === "chat") {
      const orRes = await fetch(OR_BASE, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          temperature,
          max_tokens: 256,
          stream: true,
          messages: [{ role: "system", content: scenario.chatPrompt }, ...messages],
        }),
      });

      if (!orRes.ok || !orRes.body) {
        const errText = await orRes.text().catch(() => "unknown");
        console.error("[/api/life] OpenRouter error", orRes.status, errText);
        return new Response(`[API error ${orRes.status}]\n[SCORE: 0]`, { status: 200 });
      }

      const readable = new ReadableStream({
        async start(controller) {
          const reader = orRes.body!.getReader();
          const dec = new TextDecoder();
          let buf = "";
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += dec.decode(value, { stream: true });
              const lines = buf.split("\n");
              buf = lines.pop() ?? "";
              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const payload = line.slice(6).trim();
                if (payload === "[DONE]") continue;
                try {
                  const text: string | undefined = JSON.parse(payload).choices?.[0]?.delta?.content;
                  if (text) controller.enqueue(new TextEncoder().encode(text));
                } catch {}
              }
            }
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    // ── RESOLVE (non-streaming) ───────────────────────────────────────────────
    if (phase === "resolve") {
      const closerLabel =
        closer === "own-it"       ? "OWN IT (Direct Accountability)" :
        closer === "play-it-cool" ? "PLAY IT COOL (Graceful Deflect)" :
                                    "SIDESTEP (Avoidance)";

      const systemPrompt = `You are the girlfriend in this scenario: ${scenario.title}. ${scenario.setup}
He just finished responding and made his final move. Stay in character — brief, real, and emotionally honest.
OUTPUT: Valid JSON only: {"verdict": "1-2 sentences from her perspective", "reaction": "impressed|neutral|disappointed|shut_down"}`;

      const orRes = await fetch(OR_BASE, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          temperature,
          max_tokens: 256,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            {
              role: "user",
              content: `[SCENARIO END] Total handling score: ${totalScore ?? 0} (scale: -40 to +40). He chose: ${closerLabel}. Give your final reaction.`,
            },
          ],
        }),
      });

      const data = await orRes.json() as { choices?: Array<{ message?: { content?: string } }> };
      const text = data.choices?.[0]?.message?.content ?? "{}";
      const parsed = safeParseJSON(text);

      const verdict  = (typeof parsed?.verdict === "string" ? parsed.verdict : null) ?? "Noted.";
      const reaction = (typeof parsed?.reaction === "string" ? parsed.reaction : null) ?? "neutral";

      // Map life closers → game-logic closers for win calculation
      const mappedCloser =
        closer === "own-it"       ? "flirt" :
        closer === "play-it-cool" ? "flex"  :
                                    "leave" as const;

      const safeStats: StatBlock = {
        aggression: Math.min(10, Math.max(0, stats?.aggression ?? 4)),
        defense:    Math.min(10, Math.max(0, stats?.defense    ?? 3)),
        bluff:      Math.min(10, Math.max(0, stats?.bluff      ?? 2)),
        greed:      Math.min(10, Math.max(0, stats?.greed      ?? 3)),
      };

      // Use scenario economy mapped to GirlEconomy shape
      const economy = {
        approachCost: scenario.approachCost,
        flirtWin:     scenario.ownItWin,
        flexWin:      scenario.coolWin,
        difficulty:   scenario.difficulty,
      };

      const result = calcAura(
        mappedCloser,
        totalScore ?? 0,
        economy,
        Math.min(Math.max(streak ?? 0, 0), 20),
        safeStats,
      );

      return Response.json({
        verdict,
        reaction,
        win:       result.win,
        aura:      result.aura,
        winChance: result.winChance,
      });
    }

    return Response.json({ error: "Invalid phase" }, { status: 400 });
  } catch (err) {
    console.error("[/api/life]", err);
    return Response.json({ verdict: "I need a moment.", reaction: "neutral", win: false, aura: 0, winChance: 0 }, { status: 200 });
  }
}
