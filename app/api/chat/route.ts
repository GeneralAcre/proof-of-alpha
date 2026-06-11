import { GIRL_ARCHETYPES, type Difficulty } from "../../lib/girls";

// ─── Model config per difficulty ──────────────────────────────────────────────

const MODEL_CONFIG: Record<Difficulty, { model: string; temperature: number }> = {
  easy:   { model: "meta-llama/llama-3-8b-instruct:free", temperature: 0.5 },
  medium: { model: "qwen/qwen3.5-flash-02-23",            temperature: 0.9 },
  hard:   { model: "qwen/qwen3.5-flash-02-23",            temperature: 1.1 },
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
    const { phase, archetypeId, girlName, difficulty, messages, closer, totalScore } = body;

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

      if (!orRes.ok || !orRes.body) return new Response("...\n[SCORE: 0]", { status: 200 });

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

      if (!parsed || typeof parsed.verdict !== "string") {
        return Response.json({ verdict: "Noted.", reaction: "neutral" });
      }

      return Response.json({ verdict: parsed.verdict, reaction: (parsed.reaction as string) ?? "neutral" });
    }

    return Response.json({ error: "Invalid phase" }, { status: 400 });
  } catch (err) {
    console.error("[/api/chat]", err);
    return Response.json({ verdict: "I need a moment.", reaction: "neutral" }, { status: 200 });
  }
}
