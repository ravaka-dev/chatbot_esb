import {
	type UIMessage,
	createUIMessageStream,
	createUIMessageStreamResponse,
} from "ai";

export const runtime = "nodejs";

// Remplacez par l'URL de votre Webhook n8n (idéalement dans vos variables d'environnement)
const N8N_WEBHOOK_URL = process.env.N8N_TEST_WEBHOOK_URL || "https://votre-instance-n8n.com/webhook/votre-id-webhook";

export async function POST(req: Request) {
	const { messages }: { messages: UIMessage[] } = await req.json();
	const lastMessage = messages[messages.length - 1];

	console.log("=== Nouveau message reçu ===");
	console.log(lastMessage);

	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			const id = crypto.randomUUID();

			try {
				// 1. Envoi de la requête au Webhook n8n
				const response = await fetch(N8N_WEBHOOK_URL, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						lastMessage,
					}),
				});

				if (!response.ok) {
					throw new Error(`Erreur lors de l'appel à n8n: ${response.status} ${response.statusText}`);
				}

				// 2. Extraction du résultat retourné par n8n
				const data = await response.json();
				
				// Adaptez "data.output" selon la structure de réponse configurée dans n8n
				const textResult = data.output || data.response || JSON.stringify(data);

				// 3. Envoi au client via le stream
				writer.write({ type: "text-start", id });

				// Simulation d'un effet de frappe (optionnel, supprimez la boucle si vous voulez envoyer le texte d'un bloc)
				const words = textResult.split(" ");
				for (const word of words) {
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