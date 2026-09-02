// hooks/useStreamedText.ts
"use client";

import { useEffect, useRef, useState } from "react";

interface UseStreamedTextOptions {
	charsPerSecond?: number;
}

export function useStreamedText(
	text: string,
	{ charsPerSecond = 220 }: UseStreamedTextOptions = {},
) {
	const [output, setOutput] = useState("");
	const [done, setDone] = useState(false);
	const rafRef = useRef<number | null>(null);

	useEffect(() => {
		setOutput("");
		setDone(false);

		let startTime: number | null = null;

		const step = (timestamp: number) => {
			if (startTime === null) startTime = timestamp;
			const elapsedSeconds = (timestamp - startTime) / 1000;

			// Pourquoi : nombre de caractères basé sur le temps écoulé (pas sur
			// un compteur de ticks) → avance de façon continue, insensible aux
			// variations de fréquence de rAF, et ne dérive pas comme setInterval.
			const targetIndex = Math.floor(elapsedSeconds * charsPerSecond);
			const clampedIndex = Math.min(targetIndex, text.length);

			setOutput(text.slice(0, clampedIndex));

			if (clampedIndex >= text.length) {
				setDone(true);
				return;
			}

			rafRef.current = requestAnimationFrame(step);
		};

		rafRef.current = requestAnimationFrame(step);

		return () => {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
		};
	}, [text, charsPerSecond]);

	return { text: output, done };
}
