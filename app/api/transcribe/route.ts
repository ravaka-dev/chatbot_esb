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
	transcriptionFormData.append("file", audioFile, "audio.webm");
	transcriptionFormData.append("model", "gpt-4o-transcribe");
	transcriptionFormData.append("language", "fr");
	transcriptionFormData.append(
		"prompt",
		"Transcription en français québécois/canadien. Dans une adresse courriel dictée, « a commercial », « à commercial » ou « arobase » désignent le symbole @, et « point » désigne un point. Exemple : jean point tremblay à commercial gmail point com.",
	);

	let response: Response;
	try {
		response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.OPENAI_KEY}`,
			},
			body: transcriptionFormData,
		});
	} catch (err) {
		console.error("[/api/transcribe] appel OpenAI impossible :", err);
		return NextResponse.json(
			{ error: "Service de transcription injoignable" },
			{ status: 502 },
		);
	}

	if (!response.ok) {
		const errorBody = await response.text();
		console.error("[/api/transcribe] erreur OpenAI :", errorBody);
		return NextResponse.json(
			{ error: "Échec de la transcription" },
			{ status: 502 },
		);
	}
	const { text } = (await response.json()) as { text: string };
	return NextResponse.json({ text: text });
}
