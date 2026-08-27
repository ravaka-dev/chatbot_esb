import { type NextRequest, NextResponse } from "next/server";

// Pourquoi "nodejs" : l'API de transcription renvoie un flux multipart et le
// client fetch natif se comporte plus prévisiblement sur le runtime Node
// que sur l'edge runtime pour ce type d'upload
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
	const audioFile = (await req.formData()).get("file");

	if (!(audioFile instanceof Blob)) {
		return NextResponse.json(
			{ error: "Fichier audio manquant" },
			{ status: 400 },
		);
	}

	const transcriptionFormData = new FormData();
	// Pourquoi : l'API a besoin d'un nom de fichier avec extension pour
	// déduire le format audio, sinon elle peut rejeter le blob
	transcriptionFormData.append("file", audioFile, "audio.webm");
	// Pourquoi "voxtral-mini-latest" : c'est le seul modèle exposé par
	// l'endpoint de transcription de Mistral (routé en interne vers
	// Voxtral Mini Transcribe), optimisé pour le coût et la latence
	transcriptionFormData.append("model", "voxtral-mini-latest");
	// Pourquoi : on force le français plutôt que de laisser le modèle
	// détecter la langue, plus fiable pour de courts extraits vocaux
	transcriptionFormData.append("language", "fr");

	let response: Response;
	try {
		response = await fetch("https://api.mistral.ai/v1/audio/transcriptions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
			},
			body: transcriptionFormData,
		});
	} catch (err) {
		console.error("[/api/transcribe] appel Mistral impossible :", err);
		return NextResponse.json(
			{ error: "Service de transcription injoignable" },
			{ status: 502 },
		);
	}

	if (!response.ok) {
		const errorBody = await response.text();
		console.error("[/api/transcribe] erreur Mistral :", errorBody);
		return NextResponse.json(
			{ error: "Échec de la transcription" },
			{ status: 502 },
		);
	}

	const { text } = (await response.json()) as { text: string };
	return NextResponse.json({ text });
}
