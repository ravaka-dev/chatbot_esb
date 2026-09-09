"use client";

import { useEffect, useRef, useState } from "react";

// Pourquoi : seuils de la temporisation produit — palier 2 dès 15s d'attente,
// palier 3 (dernier recours) dès 30s ; le palier 1 s'affiche dès la réception
const LEVEL_2_DELAY = 15000;
const LEVEL_3_DELAY = 30000;

const LEVEL_1_TEXT = "Ramzi IA est en train d'écrire.";

const LEVEL_2_VARIANTS = [
	"J’achève, c’est presque prêt.",
	"Encore quelques secondes.",
	"Ça s’en vient.",
	"J’y suis presque.",
];

const LEVEL_3_TEXT = "Traitement en cours";

function pickRandom<T>(items: T[]): T {
	return items[Math.floor(Math.random() * items.length)];
}

export type WaitingLevel = 1 | 2 | 3;

export interface WaitingMessage {
	level: WaitingLevel;
	paragraphs: string[];
}

// Pourquoi : une seule bulle d'attente à la fois — chaque nouvelle attente
// tire une nouvelle variante pour le palier 2, pour éviter de répéter le
// même texte d'une conversation à l'autre
export function useWaitingMessage(isWaiting: boolean): WaitingMessage | null {
	const [level, setLevel] = useState<WaitingLevel>(1);
	const level2TextRef = useRef(pickRandom(LEVEL_2_VARIANTS));

	useEffect(() => {
		if (!isWaiting) {
			setLevel(1);
			return;
		}

		level2TextRef.current = pickRandom(LEVEL_2_VARIANTS);
		setLevel(1);

		const level2Timer = setTimeout(() => setLevel(2), LEVEL_2_DELAY);
		const level3Timer = setTimeout(() => setLevel(3), LEVEL_3_DELAY);

		return () => {
			clearTimeout(level2Timer);
			clearTimeout(level3Timer);
		};
	}, [isWaiting]);

	if (!isWaiting) {
		return null;
	}

	if (level === 1) {
		return { level: 1, paragraphs: [LEVEL_1_TEXT] };
	}

	if (level === 2) {
		return { level: 2, paragraphs: [level2TextRef.current] };
	}

	return { level: 3, paragraphs: [LEVEL_3_TEXT] };
}
