"use client";

import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const PLACEHOLDER_TEXTS = [
	"Ecrire ici ...",
	"Tu peux aussi utiliser le micro.",
];

// Pourquoi : temps d'affichage de chaque texte avant de lancer le fondu suivant
const HOLD_DURATION_MS = 2500;
// Pourquoi : doit correspondre à `duration-500` dans le className du span
const FADE_DURATION_MS = 500;

interface AnimatedPlaceholderProps {
	className?: string;
}

export function AnimatedPlaceholder({ className }: AnimatedPlaceholderProps) {
	const [index, setIndex] = useState(0);
	const [visible, setVisible] = useState(true);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);
	useEffect(() => {
		const cycle = () => {
			setVisible(false); // lance le fondu de sortie (transition CSS, pas de keyframe)

			timeoutRef.current = setTimeout(() => {
				setIndex((i) => (i + 1) % PLACEHOLDER_TEXTS.length);
				setVisible(true); // le nouveau texte entre en fondu juste après

				timeoutRef.current = setTimeout(cycle, HOLD_DURATION_MS);
			}, FADE_DURATION_MS);
		};

		timeoutRef.current = setTimeout(cycle, HOLD_DURATION_MS);

		return () => clearTimeout(timeoutRef.current);
	}, []);

	return (
		<span
			className={cn(
				"pointer-events-none absolute left-3 top-1/2 truncate flex text-sm text-gray-400",
				"transition-[opacity,transform] duration-500 ease-out",
				"motion-reduce:transition-none motion-reduce:opacity-100",
				visible ? "opacity-100" : "opacity-0",
				className,
			)}
			style={{
				// Pourquoi : combine le centrage vertical (-50%) et un léger décalage
				// lors du fondu — impossible à faire proprement avec deux classes
				// -translate-y-* Tailwind qui s'écraseraient l'une l'autre
				transform: `translateY(calc(-50% + ${visible ? "0px" : "-6px"}))`,
			}}
		>
			{PLACEHOLDER_TEXTS[index]}{" "}
			{index === 1 && <Mic className="size-4 ms-2" />}
		</span>
	);
}
