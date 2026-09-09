"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { MessageResponse } from "@/components/ai-elements/message";
import {
	bubbleRadiusClass,
	paragraphPosition,
} from "@/components/chat/paragraph-bubble";
import { Card, CardContent } from "@/components/ui/card";
import { useStreamedText } from "@/hooks/useStreamedText";
import { cn } from "@/lib/utils";

// Pourquoi : même cadence que l'intro (chat-suggestions.tsx) → l'agent écrit
// visuellement de la même façon, qu'il s'agisse de l'intro ou d'une réponse
const CHARS_PER_SECOND = 25;

export interface MessageParagraphsProps {
	/** Un paragraphe par élément — chacun est déjà une part de message à part (voir app/api/chat/route.ts) */
	paragraphs: string[];
	/** true : effet de frappe caractère par caractère, un paragraphe après l'autre */
	isAnimated?: boolean;
	onAnimationComplete?: () => void;
}

function ParagraphBubble({
	index,
	children,
}: {
	index: number;
	children: ReactNode;
}) {
	return (
		<Card
			className={cn(
				"w-fit animate-in fade-in slide-in-from-bottom-2 bg-secondary py-2.5 shadow-none ring-0 duration-500",
				bubbleRadiusClass(paragraphPosition(index)),
			)}
		>
			<CardContent className="px-4 text-sm text-black">{children}</CardContent>
		</Card>
	);
}

function StreamingParagraph({
	text,
	index,
	onDone,
}: {
	text: string;
	index: number;
	onDone: () => void;
}) {
	const { text: streamed, done } = useStreamedText(text, {
		charsPerSecond: CHARS_PER_SECOND,
	});
	// Pourquoi : évite de rappeler onDone à chaque re-render du parent une fois le paragraphe terminé
	const hasNotifiedDoneRef = useRef(false);

	useEffect(() => {
		if (done && !hasNotifiedDoneRef.current) {
			hasNotifiedDoneRef.current = true;
			onDone();
		}
	}, [done, onDone]);

	// Pourquoi : texte brut (pas MessageResponse) pendant la frappe — Streamdown
	// rend le markdown en blocs, ce qui casse le flux inline et fait retomber
	// le curseur en dehors du texte au retour à la ligne ; en texte brut, le
	// curseur reste un simple span inline qui suit naturellement le retour à
	// la ligne, comme dans chat-suggestions.tsx
	return (
		<ParagraphBubble index={index}>
			<span className="whitespace-pre-line">{streamed}</span>
			{!done && (
				<span className="ml-0.5 inline-block h-5 w-0.75 animate-pulse bg-primary align-middle" />
			)}
		</ParagraphBubble>
	);
}

// Pourquoi : affiche chaque paragraphe (déjà séparé côté serveur, une part de
// message par paragraphe) dans sa propre bulle groupée. En mode animé, les
// bulles apparaissent l'une après l'autre — la suivante n'est montée qu'une
// fois la précédente entièrement écrite, comme l'intro de chat-suggestions.tsx
export function MessageParagraphs({
	paragraphs,
	isAnimated = false,
	onAnimationComplete,
}: MessageParagraphsProps) {
	const [revealedCount, setRevealedCount] = useState(0);
	const hasNotifiedCompleteRef = useRef(false);
	const allDone = paragraphs.length > 0 && revealedCount >= paragraphs.length;

	useEffect(() => {
		if (isAnimated && allDone && !hasNotifiedCompleteRef.current) {
			hasNotifiedCompleteRef.current = true;
			onAnimationComplete?.();
		}
	}, [isAnimated, allDone, onAnimationComplete]);

	if (paragraphs.length === 0) {
		return null;
	}

	return (
		<div className="flex w-fit flex-col gap-1">
			{paragraphs.map((paragraph, index) => {
				if (!isAnimated) {
					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: l'index est la seule identité stable d'une part de message
						<ParagraphBubble index={index} key={index}>
							<MessageResponse>{paragraph}</MessageResponse>
						</ParagraphBubble>
					);
				}

				if (index > revealedCount) {
					return null;
				}

				return (
					<StreamingParagraph
						index={index}
						// biome-ignore lint/suspicious/noArrayIndexKey: l'index est la seule identité stable d'une part de message
						key={index}
						onDone={() =>
							setRevealedCount((count) => Math.max(count, index + 1))
						}
						text={paragraph}
					/>
				);
			})}
		</div>
	);
}
