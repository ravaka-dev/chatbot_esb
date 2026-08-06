import {
	type UIMessage,
	createUIMessageStream,
	createUIMessageStreamResponse,
} from "ai";

export const runtime = "nodejs";

// Remplacez par l'URL de votre Webhook n8n (idéalement dans vos variables d'environnement)
const N8N_WEBHOOK_URL = process.env.N8N_TEST_WEBHOOK_URL || ''

export async function POST(req: Request) {
	const { messages, sessionId }: { messages: UIMessage[]; sessionId: string } =
		await req.json();
	const lastMessage = messages[messages.length - 1];

	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			const id = crypto.randomUUID();
			try {
				const response = await fetch(N8N_WEBHOOK_URL, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ session_id : sessionId, message: lastMessage }),
				});

				if (!response.ok) {
					throw new Error(`Erreur lors de l'appel à n8n: ${response.status}`);
				}

				type N8nResponse = { message: string };
				const data: N8nResponse = await response.json();
				const textResult = data.message;

				writer.write({ type: "text-start", id });
				for (const word of textResult.split(" ")) {
					writer.write({ type: "text-delta", id, delta: `${word} ` });
					await new Promise((resolve) => setTimeout(resolve, 30));
				}
				writer.write({ type: "text-end", id });
			} catch (error) {
				console.error("Erreur Webhook n8n:", error);
				writer.write({ type: "text-start", id });
				writer.write({
					type: "text-delta",
					id,
					delta: "Désolé, une erreur s'est produite lors du traitement de votre demande.",
				});
				writer.write({ type: "text-end", id });
			}
		},
	});

	return createUIMessageStreamResponse({ stream });
}