// chat-suggestions.tsx
"use client";

import { useStreamedText } from "@/hooks/useStreamedText";
import { cn } from "@/lib/utils";

// Pourquoi : défini hors du composant → référence stable, l'effet ne redémarre pas à chaque re-render
const INTRO_TEXT = `Bonjour! Je me présente : Ramzi, l’agent IA d’ESB Agence Numérique & IA. 

Je porte le même prénom que Ramzi, notre spécialiste numérique humain. Lui, c’est l’original… et moi, la version disponible même à 11 h le soir - en fait, 24/7! 😉 

Mon rôle est surtout de comprendre les réalités et les objectifs des entreprises afin de voir comment nous pouvons les aider à les atteindre le plus efficacement possible. 

D’ailleurs, permets-moi une petite question : quel est ton rôle professionnel actuellement?`;

export function ChatSuggestions() {
	const { text: streamedIntro, done } = useStreamedText(INTRO_TEXT, {
		charsPerSecond: 25,
	});

	return (
		<div className="space-y-4 py-4">
			<p className="whitespace-pre-line text-sm text-muted-foreground">
				{streamedIntro}
				{!done && (
					<span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-muted-foreground/60 align-middle" />
				)}
			</p>
			<div
				className={cn(
					"flex flex-col gap-2 transition-opacity duration-300",
					done ? "opacity-100" : "pointer-events-none opacity-0",
				)}
			></div>
		</div>
	);
}
