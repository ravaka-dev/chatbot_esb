"use client";

import { MessageResponse } from "@/components/ai-elements/message";
import {
	bubbleRadiusClass,
	paragraphPosition,
} from "@/components/chat/paragraph-bubble";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface MessageParagraphsProps {
	/** Un paragraphe par élément — chacun est déjà une part de message à part (voir app/api/chat/route.ts) */
	paragraphs: string[];
	isStreaming: boolean;
}

// Pourquoi : affiche chaque paragraphe (déjà séparé côté serveur, une part de
// message par paragraphe) dans sa propre bulle groupée — même style que
// l'intro de chat-suggestions.tsx — plutôt qu'un seul bloc de texte ; le
// dernier paragraphe garde le curseur clignotant tant que le message entier
// n'a pas fini de streamer
export function MessageParagraphs({
	paragraphs,
	isStreaming,
}: MessageParagraphsProps) {
	if (paragraphs.length === 0) {
		return null;
	}

	return (
		<div className="flex w-fit flex-col gap-1">
			{paragraphs.map((paragraph, index) => {
				const isLast = index === paragraphs.length - 1;
				const done = !isLast || !isStreaming;

				return (
					<Card
						className={cn(
							"w-fit animate-in fade-in slide-in-from-bottom-2 bg-secondary py-2.5 shadow-none ring-0 duration-500",
							bubbleRadiusClass(paragraphPosition(index)),
						)}
						// biome-ignore lint/suspicious/noArrayIndexKey: liste strictement croissante (append-only) au fil du streaming, jamais réordonnée
						key={index}
					>
						<CardContent className="px-4 text-sm text-black">
  <div className="inline">
    <MessageResponse>{paragraph}</MessageResponse>
    {!done && (
      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
    )}
  </div>
</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
