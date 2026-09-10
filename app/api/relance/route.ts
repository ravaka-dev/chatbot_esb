import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Pourquoi : même webhook n8n que /api/chat — le workflow distingue les
// deux cas via le champ "type" du body
const N8N_WEBHOOK_URL = process.env.N8N_PROD_WEBHOOK_URL || "";

interface RelanceRequestBody {
	sessionId: string;
	relanceCount: number;
	derniereBulle: string;
	premierEchange: boolean;
	relancesPrecedentes: string[];
}

interface N8nRelanceResponse {
	message?: string[];
	relance_autorisee?: boolean;
	stop?: boolean;
}

export async function POST(req: Request) {
	const body: RelanceRequestBody = await req.json();

	try {
		const response = await fetch(N8N_WEBHOOK_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				type: "relance",
				session_id: body.sessionId,
				relance_count: body.relanceCount,
				derniere_bulle: body.derniereBulle,
				premier_echange: body.premierEchange,
				relances_precedentes: body.relancesPrecedentes,
			}),
		});

		if (!response.ok) {
			throw new Error(
				`Erreur lors de l'appel à n8n (relance): ${response.status}`,
			);
		}

		const data: N8nRelanceResponse = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Erreur Webhook n8n (relance):", error);
		// Pourquoi : une relance qui échoue ne doit pas insister — le widget
		// interprète relance_autorisee: false comme "on arrête d'essayer"
		return NextResponse.json({ message: [], relance_autorisee: false });
	}
}
