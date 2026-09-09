// chat-suggestions.tsx
"use client";

import { useEffect, useRef, useState } from "react";

import { MessageMeta } from "@/components/ai-elements/message-meta";
import {
	type BubblePosition,
	bubbleRadiusClass,
} from "@/components/chat/paragraph-bubble";
import { Card, CardContent } from "@/components/ui/card";
import { useStreamedText } from "@/hooks/useStreamedText";
import { cn } from "@/lib/utils";

// Pourquoi : défini hors du composant → référence stable, l'effet ne redémarre pas à chaque re-render
const PARAGRAPHS = [
	`Bonjour ! Mon nom est  Ramzi IA l’agent virtuel  d’ESB Agence Numérique + IA`,
	`Je vérifie à quel niveau ton entreprise sort dans Google et dans les agents IA. Qu’en dis-tu que je regarde cela ? Comme tu le sais, c’est un must pour être vu par tes prospects ou futurs candidats.`,
];

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
				"w-fit animate-in fade-in slide-in-from-bottom-2 bg-secondary py-2.5 shadow-none ring-0 duration-300",
				bubbleRadiusClass(position),
			)}
		>
			<CardContent className="whitespace-pre-line px-4 text-sm text-black">
				{streamed}
				{!done && (
					<span className="ml-0.5 inline-block h-5 w-0.75 animate-pulse bg-primary align-middle" />
				)}
			</CardContent>
		</Card>
	);
}

// Pourquoi : composant séparé pour l'affichage statique — MessageParagraphs
// gère le streaming au niveau serveur, pas l'effet de frappe caractère par
// caractère utilisé ici, donc on garde une bulle simple sans animation
function StaticParagraphs({ paragraphs }: { paragraphs: string[] }) {
	return (
		<div className="flex flex-col gap-1">
			{paragraphs.map((paragraph, index) => (
				<Card
					className={cn(
						"w-fit bg-secondary py-2.5 shadow-none ring-0",
						bubbleRadiusClass(index === 0 ? "first" : "other"),
					)}
					key={paragraph}
				>
					<CardContent className="whitespace-pre-line px-4 text-sm text-black">
						{paragraph}
					</CardContent>
				</Card>
			))}
		</div>
	);
}

interface ChatSuggestionsProps {
	/** false : les paragraphes s'affichent directement, sans effet de frappe */
	isAnimated?: boolean;
}

export function ChatSuggestions({ isAnimated = true }: ChatSuggestionsProps) {
	const [revealedCount, setRevealedCount] = useState(
		isAnimated ? 0 : PARAGRAPHS.length,
	);
	const allDone = revealedCount === PARAGRAPHS.length;

	return (
		<div>
			{isAnimated ? (
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
			) : (
				<StaticParagraphs paragraphs={PARAGRAPHS} />
			)}
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
