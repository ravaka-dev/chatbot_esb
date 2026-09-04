import {
	createUIMessageStream,
	createUIMessageStreamResponse,
	type UIMessage,
} from "ai";

export const runtime = "nodejs";
export const maxDuration = 300; // Ajout du timeout de 10 minutes (600 secondes)

// Remplacez par l'URL de votre Webhook n8n (idéalement dans vos variables d'environnement)
const N8N_WEBHOOK_URL = process.env.N8N_PROD_WEBHOOK_URL || "";

const WORD_STREAM_DELAY_MS = 60;

export async function POST(req: Request) {
	const { messages, sessionId }: { messages: UIMessage[]; sessionId: string } =
		await req.json();
	const lastMessage = messages[messages.length - 1];

	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			// Pourquoi : un id distinct par paragraphe → chaque paragraphe est une
			// part de message à part entière, animée mot par mot indépendamment
			// (le client, MessageParagraphs, affiche chaque part dans sa propre bulle)
			const streamParagraphs = async (paragraphs: string[]) => {
				for (const paragraph of paragraphs) {
					const id = crypto.randomUUID();
					writer.write({ type: "text-start", id });
					for (const word of paragraph.split(" ")) {
						writer.write({ type: "text-delta", id, delta: `${word} ` });
						await new Promise((resolve) =>
							setTimeout(resolve, WORD_STREAM_DELAY_MS),
						);
					}
					writer.write({ type: "text-end", id });
				}
			};

			try {
				const response = await fetch(N8N_WEBHOOK_URL, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ session_id: sessionId, message: lastMessage }),
				});

				if (!response.ok) {
					throw new Error(`Erreur lors de l'appel à n8n: ${response.status}`);
				}

				type N8nResponse = { message: string[] };
				const data: N8nResponse = await response.json();

				await streamParagraphs(data.message);
			} catch (error) {
				console.error("Erreur Webhook n8n:", error);
				await streamParagraphs([
					"Désolé, une erreur s'est produite lors du traitement de votre demande.",
				]);
			}
		},
	});

	return createUIMessageStreamResponse({ stream });
}
