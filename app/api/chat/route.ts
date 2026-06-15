import { GIRL_ARCHETYPES, type Difficulty } from "../../lib/girls";
import { calcAura } from "../../lib/game-logic";
import { createAwardToken } from "../../lib/award-token";
import type { StatBlock } from "../../lib/archetypes";

const MODEL = "meta-llama/llama-3.1-8b-instruct";

const MODEL_CONFIG: Record<Difficulty, { model: string; temperature: number }> = {
  easy:   { model: MODEL, temperature: 0.5 },
  medium: { model: MODEL, temperature: 0.8 },
  hard:   { model: MODEL, temperature: 1.0 },
};

const OR_BASE = "https://openrouter.ai/api/v1/chat/completions";

type ChatRequest = {
  phase: "chat" | "resolve";
  archetypeId: string;
  girlName: string;
  difficulty: Difficulty;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  closer?: "flirt" | "flex" | "leave";
  totalScore?: number;
  // Resolve-phase extras for server-side win computation
  playerWallet?: string;
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
    const body = (await req.json()) as ChatRequest;
    const { phase, archetypeId, girlName, difficulty, messages, closer, totalScore, playerWallet, streak, stats } = body;

    const { model, temperature } = MODEL_CONFIG[difficulty] ?? MODEL_CONFIG.easy;
    const archetype = GIRL_ARCHETYPES.find((a) => a.id === archetypeId);

    if (!archetype) {
      return new Response("...\n[SCORE: 0]", { status: 200 });
    }

    // ── CHAT (streaming) ──────────────────────────────────────────────────────
    if (phase === "chat") {
      const systemPrompt = archetype.chatPrompt.replace(/\{\{name\}\}/g, girlName);

      const orRes = await fetch(OR_BASE, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model, temperature,
          max_tokens: 256,
          stream: true,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
        }),
      });

      if (!orRes.ok || !orRes.body) {
        const errText = await orRes.text().catch(() => "unknown");
        console.error("[/api/chat] OpenRouter error", orRes.status, errText);
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
        closer === "flirt" ? "FLIRT (Rizz)" :
        closer === "flex"  ? "FLEX (Posture)" :
                             "LEAVE (Walk Away)";

      const systemPrompt = `You are ${girlName}, a ${archetype.title}. ${archetype.personality}
A man just finished chatting with you and made his move. Stay in character — sharp, brief, real.
OUTPUT: Valid JSON only: {"verdict": "1-2 sentences", "reaction": "impressed|neutral|disgusted|sigma_respect"}`;

      const orRes = await fetch(OR_BASE, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model, temperature,
          max_tokens: 256,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            {
              role: "user",
              content: `[GAME EVENT] Attraction Score: ${totalScore ?? 0} (scale: -40 to +40). He chose: ${closerLabel}. Give your final verdict.`,
            },
          ],
        }),
      });

      const data = await orRes.json() as { choices?: Array<{ message?: { content?: string } }> };
      const text = data.choices?.[0]?.message?.content ?? "{}";
      const parsed = safeParseJSON(text);

      const verdict  = (typeof parsed?.verdict === "string" ? parsed.verdict : null) ?? "Noted.";
      const reaction = (typeof parsed?.reaction === "string" ? parsed.reaction : null) ?? "neutral";

      // ── Server-side win/loss computation ─────────────────────────────────────
      // Clamp stats to valid range so client can't inflate the bonus
      const safeStats: StatBlock = {
        aggression: Math.min(10, Math.max(0, stats?.aggression ?? 4)),
        defense:    Math.min(10, Math.max(0, stats?.defense    ?? 3)),
        bluff:      Math.min(10, Math.max(0, stats?.bluff      ?? 2)),
        greed:      Math.min(10, Math.max(0, stats?.greed      ?? 3)),
      };

      const result = calcAura(
        closer ?? "leave",
        totalScore ?? 0,
        archetype,
        Math.min(Math.max(streak ?? 0, 0), 20), // cap streak to prevent multiplier abuse
        safeStats,
      );

      // Generate a short-lived HMAC token the client must present to /api/award-aura
      let token: string | null = null;
      if (result.win && result.aura > 0 && playerWallet) {
        try {
          token = createAwardToken(playerWallet, result.aura);
        } catch {
          // AWARD_HMAC_SECRET not set — on-chain award skipped
        }
      }

      return Response.json({
        verdict,
        reaction,
        win: result.win,
        aura: result.aura,
        winChance: result.winChance,
        token,
      });
    }

    return Response.json({ error: "Invalid phase" }, { status: 400 });
  } catch (err) {
    console.error("[/api/chat]", err);
    return Response.json({ verdict: "I need a moment.", reaction: "neutral", win: false, aura: 0, winChance: 0, token: null }, { status: 200 });
  }
}
