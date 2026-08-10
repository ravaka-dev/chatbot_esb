// app/api/chat/route.ts
import {
  type UIMessage,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { getAndDeletePendingResponse } from "@/lib/chat-store";

export const runtime = "nodejs";

const N8N_WEBHOOK_URL = process.env.N8N_PROD_WEBHOOK_URL || "";

/**
 * Polling interne interrogeant Redis jusqu'à l'arrivée de la réponse du Callback n8n
 */
async function waitForCallbackResponse(
  sessionId: string,
  timeoutMs = 400000,
  intervalMs = 800
): Promise<string> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const response = await getAndDeletePendingResponse(sessionId);
    if (response) {
      return response;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Timeout: n8n n'a pas répondu dans le délai imparti.");
}

export async function POST(req: Request) {
  const { messages, sessionId }: { messages: UIMessage[]; sessionId: string } =
    await req.json();
  const lastMessage = messages[messages.length - 1];

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const id = crypto.randomUUID();
      try {
        // 1. Déclenchement du Webhook n8n (Réponse immédiate si 'Respond Immediately' est activé)
        const triggerRes = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, message: lastMessage }),
        });

        if (!triggerRes.ok) {
          throw new Error(`Erreur initialisation n8n: ${triggerRes.status}`);
        }

        // 2. Attente de la réponse stockée par la route callback dans Redis
        const textResult = await waitForCallbackResponse(sessionId);

        // 3. Streaming de la réponse vers ChatWidget
        writer.write({ type: "text-start", id });
        for (const word of textResult.split(" ")) {
          writer.write({ type: "text-delta", id, delta: `${word} ` });
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
        writer.write({ type: "text-end", id });
      } catch (error) {
        console.error("Erreur traitement Chat avec Redis:", error);
        writer.write({ type: "text-start", id });
        writer.write({
          type: "text-delta",
          id,
          delta: "Désolé, le traitement a pris trop de temps ou une erreur s'est produite.",
        });
        writer.write({ type: "text-end", id });
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}