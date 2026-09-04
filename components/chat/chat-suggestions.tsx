// chat-suggestions.tsx
"use client";

import { useEffect, useRef, useState } from "react";

import { MessageMeta } from "@/components/ai-elements/message-meta";
import { Card, CardContent } from "@/components/ui/card";
import { useStreamedText } from "@/hooks/useStreamedText";
import { cn } from "@/lib/utils";

// Pourquoi : défini hors du composant → référence stable, l'effet ne redémarre pas à chaque re-render
const PARAGRAPHS = [
	`Bonjour! Je me présente : Ramzi, l’agent IA d’ESB Agence Numérique & IA.`,
	`Je porte le même prénom que Ramzi, notre spécialiste numérique humain. Lui, c’est l’original… et moi, la version disponible même à 11 h le soir - en fait, 24/7! 😉`,
	`Mon rôle est surtout de comprendre les réalités et les objectifs des entreprises afin de voir comment nous pouvons les aider à les atteindre le plus efficacement possible.`,
	`D’ailleurs, permets-moi une petite question : quel est ton rôle professionnel actuellement?`,
];

// Pourquoi : bulles d'un même message groupées visuellement en un seul bloc →
// seule la première a le côté gauche arrondi (coin haut-gauche), les
// suivantes ont le côté gauche entièrement carré pour rester collées au
// bloc ; le côté droit reste arrondi sur toutes les bulles.
type BubblePosition = "first" | "other";

function bubbleRadiusClass(position: BubblePosition) {
	return position === "first"
		? "rounded-lg rounded-bl-none"
		: "rounded-r-lg rounded-l-none";
}

function StreamingParagraph({
	text,
	position,
	onDone,
}: {
	text: string;
	position: BubblePosition;
	onDone: () => void;
}) {
	const { text: streamed, done } = useStreamedText(text, {
		charsPerSecond: 25,
	});
	// Pourquoi : évite de rappeler onDone à chaque re-render du parent une fois le paragraphe terminé
	const hasNotifiedDoneRef = useRef(false);

	useEffect(() => {
		if (done && !hasNotifiedDoneRef.current) {
			hasNotifiedDoneRef.current = true;
			onDone();
		}
	}, [done, onDone]);

	return (
		<Card
			className={cn(
				"w-fit animate-in fade-in slide-in-from-bottom-2 bg-primary py-2.5 shadow-none ring-0 duration-300",
				bubbleRadiusClass(position),
			)}
		>
			<CardContent className="whitespace-pre-line px-4 text-sm text-primary-foreground">
				{streamed}
				{!done && (
					<span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-primary-foreground/60 align-middle" />
				)}
			</CardContent>
		</Card>
	);
}

export function ChatSuggestions() {
	const [revealedCount, setRevealedCount] = useState(0);
	const allDone = revealedCount === PARAGRAPHS.length;

	return (
		<div className="py-4">
			<div className="flex flex-col gap-1">
				{PARAGRAPHS.map((paragraph, index) => {
					if (index > revealedCount) return null;

					const position: BubblePosition = index === 0 ? "first" : "other";

					return (
						<StreamingParagraph
							key={paragraph}
							position={position}
							text={paragraph}
							onDone={() =>
								setRevealedCount((count) => Math.max(count, index + 1))
							}
						/>
					);
				})}
			</div>
			{allDone && (
				<MessageMeta
					className="animate-in fade-in duration-300"
					name="Ramzi IA"
					roleLabel="Agent IA"
				/>
			)}
			<div
				className={cn(
					"flex flex-col gap-2 transition-opacity duration-300",
					allDone ? "opacity-100" : "pointer-events-none opacity-0",
				)}
			></div>
		</div>
	);
}
