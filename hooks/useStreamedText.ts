// hooks/useStreamedText.ts
"use client";

import { useEffect, useState } from "react";

interface UseStreamedTextOptions {
	wordsPerTick?: number;
	intervalMs?: number;
}

export function useStreamedText(
	text: string,
	{ wordsPerTick = 2, intervalMs = 35 }: UseStreamedTextOptions = {},
) {
	const [output, setOutput] = useState("");
	const [done, setDone] = useState(false);

	useEffect(() => {
		// Pourquoi : découpage par mots, comme smoothStream({ chunking: "word" })
		// côté serveur — même rythme visuel que les vraies réponses streamées.
		const words = text.split(" ");
		let index = 0;
		setOutput("");
		setDone(false);

		const id = setInterval(() => {
			index += wordsPerTick;
			setOutput(words.slice(0, index).join(" "));
			if (index >= words.length) {
				clearInterval(id);
				setDone(true);
			}
		}, intervalMs);

		return () => clearInterval(id);
	}, [text, wordsPerTick, intervalMs]);

	return { text: output, done };
}
