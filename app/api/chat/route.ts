import {
	type UIMessage,
	createUIMessageStream,
	createUIMessageStreamResponse,
} from "ai";

export const runtime = "nodejs";

const DEBUG_TEXT =
	"Message bien reçu (mode debug, aucun traitement IA pour le moment).";

export async function POST(req: Request) {
	const { messages }: { messages: UIMessage[] } = await req.json();

	const lastMessage = messages[messages.length - 1];

	console.log("=== Nouveau message reçu ===");
	console.log(messages);

	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			const id = crypto.randomUUID();
			const words = DEBUG_TEXT.split(" ");

			writer.write({ type: "text-start", id });

			for (const word of words) {
				writer.write({ type: "text-delta", id, delta: `${word} ` });
				await new Promise((resolve) => setTimeout(resolve, 60));
			}

			writer.write({ type: "text-end", id });
		},
	});

	return createUIMessageStreamResponse({ stream });
}

// app/api/chat/route.ts
// import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
// import { randomUUID } from "crypto";

// export async function POST(req: Request) {
//   const { messages } = await req.json();
//   const last = messages[messages.length - 1];
//   const userMessage = last.parts.find((p: any) => p.type === "text")?.text ?? "";

//   const n8nRes = await fetch(process.env.N8N_WEBHOOK_URL!, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       message_id: randomUUID(),
//       client_id: process.env.ESB_CLIENT_ID, // à définir selon ton besoin, voir plus bas
//       client_name: process.env.ESB_CLIENT_NAME,
//       user_message: userMessage,
//     }),
//   });

//   if (!n8nRes.ok) {
//     throw new Error(`n8n a répondu ${n8nRes.status}`);
//   }

//   const data = await n8nRes.json();
//   const replyText = data.message ?? data.output ?? "Désolé, une erreur est survenue.";

//   // Pourquoi : useChat attend un flux SSE au format UI message,
//   // même quand la réponse arrive d'un coup (pas de vrai streaming côté n8n)
//   const stream = createUIMessageStream({
//     execute: async ({ writer }) => {
//       writer.write({ type: "text-start", id: "1" });
//       writer.write({ type: "text-delta", id: "1", delta: replyText });
//       writer.write({ type: "text-end", id: "1" });
//     },
//   });

//   return createUIMessageStreamResponse({ stream });
// }