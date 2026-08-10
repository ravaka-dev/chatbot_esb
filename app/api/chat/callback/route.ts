// app/api/chat/callback/route.ts
import { NextResponse } from "next/server";
import { savePendingResponse } from "@/lib/chat-store";

export async function POST(req: Request) {
  try {
    const { message, session_id } = await req.json();

    if (!session_id || !message) {
      return NextResponse.json(
        { error: "Les champs session_id et message sont requis" },
        { status: 400 }
      );
    }

    // Stockage temporaire dans Redis
    await savePendingResponse(session_id, message);

    return NextResponse.json({ success: true, message: "Réponse mise en cache dans Redis" });
  } catch (error) {
    console.error("Erreur Callback n8n:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la réception du callback" },
      { status: 500 }
    );
  }
}