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
	`Bonjour ! Mon nom est Ramzi. Je suis l’agent IA d’ESB Agence Numérique + IA . `,
	`Je vérifie à quel niveau ton entreprise sort dans Google et dans les agents IA. On regarde ça ? `,
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

export function ChatSuggestions() {
	const [revealedCount, setRevealedCount] = useState(0);
	const allDone = revealedCount === PARAGRAPHS.length;

	return (
		<div>
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
