"use client";

import { useEffect, useState } from "react";

// Pourquoi : seuils de la temporisation produit — palier 2 dès 15s d'attente,
// palier 3 (dernier recours) dès 30s ; le palier 1 s'affiche dès la réception
const LEVEL_2_DELAY = 15000;
const LEVEL_3_DELAY = 30000;

const LEVEL_1_TEXT = "";

const LEVEL_2_TEXT = "Ça ne sera pas long";

const LEVEL_3_TEXT = "Traitement en cours";

export type WaitingLevel = 1 | 2 | 3;

export interface WaitingMessage {
	level: WaitingLevel;
	paragraphs: string[];
}

export function useWaitingMessage(isWaiting: boolean): WaitingMessage | null {
	const [level, setLevel] = useState<WaitingLevel>(1);

	useEffect(() => {
		if (!isWaiting) {
			setLevel(1);
			return;
		}

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
		return { level: 2, paragraphs: [LEVEL_2_TEXT] };
	}

	return { level: 3, paragraphs: [LEVEL_3_TEXT] };
}
