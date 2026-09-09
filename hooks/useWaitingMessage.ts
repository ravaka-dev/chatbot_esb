"use client";

import { useEffect, useRef, useState } from "react";

// Pourquoi : seuils de la temporisation produit — palier 2 dès 15s d'attente,
// palier 3 (dernier recours) dès 30s ; le palier 1 s'affiche dès la réception
const LEVEL_2_DELAY = 15000;
const LEVEL_3_DELAY = 30000;

const LEVEL_1_VARIANTS = [
	"Merci ! Un instant, je regarde.",
	"Merci ! Je jette un œil.",
	"Merci ! Je vérifie ça tout de suite.",
	"Merci ! Laisse-moi voir.",
];

const LEVEL_2_VARIANTS = [
	"J’achève, c’est presque prêt.",
	"Encore quelques secondes.",
	"Ça s’en vient.",
	"J’y suis presque.",
];

const LEVEL_3_MIDDLE_VARIANTS = [
	"Notre spécialiste humain, lui, prend le temps de tout regarder — Google et les IA.",
	"Notre spécialiste humain peut regarder ça comme il faut, Google et les IA.",
	"Notre spécialiste humain a les bons outils pour aller au fond de ça.",
];

const level3Paragraphs = (middle: string) => [
	"Désolé, mon test est plus long que d’habitude.",
	middle,
	"Que dis-tu qu’on prévoie une rencontre ?",
];

function pickRandom<T>(items: T[]): T {
	return items[Math.floor(Math.random() * items.length)];
}

function pickVariants() {
	return {
		level1: pickRandom(LEVEL_1_VARIANTS),
		level2: pickRandom(LEVEL_2_VARIANTS),
		level3Middle: pickRandom(LEVEL_3_MIDDLE_VARIANTS),
	};
}

export type WaitingLevel = 1 | 2 | 3;

export interface WaitingMessage {
	level: WaitingLevel;
	paragraphs: string[];
}

// Pourquoi : une seule bulle d'attente à la fois (le niveau 3 en montre trois,
// mais c'est le dernier recours) — chaque nouvelle attente tire de nouvelles
// variantes pour éviter de répéter le même texte d'une conversation à l'autre
export function useWaitingMessage(isWaiting: boolean): WaitingMessage | null {
	const [level, setLevel] = useState<WaitingLevel>(1);
	const variantsRef = useRef(pickVariants());

	useEffect(() => {
		if (!isWaiting) {
			setLevel(1);
			return;
		}

		variantsRef.current = pickVariants();
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
		return { level: 1, paragraphs: [variantsRef.current.level1] };
	}

	if (level === 2) {
		return { level: 2, paragraphs: [variantsRef.current.level2] };
	}

	return {
		level: 3,
		paragraphs: level3Paragraphs(variantsRef.current.level3Middle),
	};
}
