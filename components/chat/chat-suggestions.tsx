// chat-suggestions.tsx
"use client";

import { useStreamedText } from "@/hooks/useStreamedText";
import { cn } from "@/lib/utils";

const SUGGESTIONS = ["Je souhaite prendre rendez-vous avec votre expert."];

// Pourquoi : défini hors du composant → référence stable, l'effet ne redémarre pas à chaque re-render
const INTRO_TEXT = `Bonjour 👋

Je suis Ramzi AI, l'assistant de Ramzi, expert en SEO & GEO.
Votre site peut avoir du potentiel sans que vous sachiez exactement quoi améliorer, pourquoi votre visibilité stagne ou comment être mieux référencé sur Google et les moteurs de recherche IA.

🎯 Mon rôle est simple : comprendre votre situation et vous mettre en relation avec Ramzi, afin que vous puissiez bénéficier de conseils adaptés à votre projet.

📅 Prenez rendez-vous avec notre expert et échangez sur votre site, vos objectifs et les opportunités d'amélioration.
Je peux vous aider à organiser votre rendez-vous dès maintenant. 🤝`;

interface ChatSuggestionsProps {
	onSelect: (suggestion: string) => void;
}

export function ChatSuggestions({ onSelect }: ChatSuggestionsProps) {
	const { text: streamedIntro, done } = useStreamedText(INTRO_TEXT, {
		wordsPerTick: 2,
		intervalMs: 100,
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
			>
				{SUGGESTIONS.map((s) => (
					<button
						key={s}
						type="button"
						onClick={() => onSelect(s)}
						className="rounded-xl border border-border bg-secondary px-3 py-2 text-left text-sm transition-colors hover:border-primary/60 hover:bg-secondary"
					>
						{s}
					</button>
				))}
			</div>
		</div>
	);
}
