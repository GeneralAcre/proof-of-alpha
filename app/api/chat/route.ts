import Anthropic from "@anthropic-ai/sdk";
import { CHAT_SYSTEM_PROMPTS, RESOLVE_SYSTEM_PROMPTS, type GirlId } from "../../lib/girls";

const client = new Anthropic();

type ChatRequest = {
  phase: "chat" | "resolve";
  girlId: GirlId;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  closer?: "flirt" | "flex" | "leave";
  totalScore?: number;
};

function safeParseJSON(text: string): Record<string, unknown> | null {
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as ChatRequest;
    const { phase, girlId, messages, closer, totalScore } = body;

    if (phase === "chat") {
      const systemPrompt = CHAT_SYSTEM_PROMPTS[girlId];
      if (!systemPrompt) {
        return new Response("...\n[SCORE: 0]", { status: 200 });
      }

      const stream = client.messages.stream({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        system: systemPrompt,
        messages,
      });

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              if (
                chunk.type === "content_block_delta" &&
                chunk.delta.type === "text_delta"
              ) {
                controller.enqueue(new TextEncoder().encode(chunk.delta.text));
              }
            }
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (phase === "resolve") {
      const systemPrompt = RESOLVE_SYSTEM_PROMPTS[girlId];
      if (!systemPrompt) {
        return Response.json({ verdict: "Whatever.", reaction: "neutral" }, { status: 200 });
      }

      const closerLabel =
        closer === "flirt" ? "FLIRT (Rizz)" :
        closer === "flex"  ? "FLEX (Posture)" :
                             "LEAVE (Walk Away)";
      const scoreContext = `His total Attraction Score during the chat was ${totalScore ?? 0} (scale: -40 to +40).`;
      const closerContext = `He chose to: ${closerLabel}.`;

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        system: systemPrompt,
        messages: [
          ...messages,
          {
            role: "user",
            content: `[GAME EVENT] ${scoreContext} ${closerContext} Give your final verdict.`,
          },
        ],
      });

      const text = response.content[0]?.type === "text" ? response.content[0].text : "{}";
      const parsed = safeParseJSON(text);

      if (!parsed || typeof parsed.verdict !== "string") {
        return Response.json({ verdict: "Noted.", reaction: "neutral" });
      }

      return Response.json({
        verdict: parsed.verdict as string,
        reaction: (parsed.reaction as string) ?? "neutral",
      });
    }

    return Response.json({ error: "Invalid phase" }, { status: 400 });
  } catch (err) {
    console.error("[/api/chat]", err);
    return Response.json({ verdict: "I need a moment.", reaction: "neutral" }, { status: 200 });
  }
}
