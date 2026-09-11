"use client";

import type { UIMessage } from "ai";
import { useCallback, useEffect, useRef } from "react";

const RELANCE_DELAYS_MS = [15000, 30000, 60000];
const HISTORIQUE_MAX = 20;

export type ChatStatus = "submitted" | "streaming" | "ready" | "error";

interface RelanceMetadata {
	/** Marque un message injecté par une relance, pour ne pas le confondre avec un vrai tour de conversation */
	relance?: boolean;
	relanceAutorisee?: boolean;
}

interface RelanceApiResponse {
	message?: string[];
	relance_autorisee?: boolean;
	stop?: boolean;
}

export interface UseRelanceOptions {
	/** Actif seulement quand le widget est ouvert */
	enabled: boolean;
	sessionId: string;
	status: ChatStatus;
	messages: UIMessage[];
	/** Contenu actuel du champ de saisie — tant qu'il y a du texte, pas de relance */
	draftValue: string;
	onRelance: (paragraphs: string[]) => void;
}

const getMetadata = (message: UIMessage): RelanceMetadata =>
	(message.metadata as RelanceMetadata | undefined) ?? {};

const paragraphsOf = (message: UIMessage) =>
	message.parts.filter((part) => part.type === "text").map((part) => part.text);

// Pourquoi : relance le prospect inactif via le même webhook n8n que le chat
// (type: "relance", voir app/api/relance/route.ts) — n8n ne peut pas pousser
// de message après coup une fois sa réponse envoyée, c'est donc le widget
// qui mesure le silence et redemande une relance au workflow
export function useRelance({
	enabled,
	sessionId,
	status,
	messages,
	draftValue,
	onRelance,
}: UseRelanceOptions) {
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const countRef = useRef(0);
	const autoriseeRef = useRef(true);
	const fetchingRef = useRef(false);
	const derniereBulleRef = useRef("");
	const historiqueRef = useRef<string[]>([]);
	const lastRealAssistantIdRef = useRef<string | null>(null);
	const lastUserIdRef = useRef<string | null>(null);
	const hasUserMessageRef = useRef(false);

	// Pourquoi des refs : évite les closures obsolètes dans le setTimeout,
	// qui vit plus longtemps qu'un render — et donne à clearTimer/schedule/fire
	// une identité stable (useCallback) sans devoir lister enabled/status/... comme dépendances
	const liveRef = useRef({ enabled, sessionId, status, draftValue });
	liveRef.current = { draftValue, enabled, sessionId, status };
	const onRelanceRef = useRef(onRelance);
	onRelanceRef.current = onRelance;

	const clearTimer = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	const scheduleRef = useRef<() => void>(() => {});

	const fire = useCallback(async () => {
		timerRef.current = null;
		const s = liveRef.current;
		if (!s.enabled || fetchingRef.current) {
			return;
		}
		if (s.status === "submitted" || s.status === "streaming") {
			return;
		}
		if (s.draftValue.trim()) {
			// Pourquoi : le prospect est en train d'écrire, on patiente encore
			scheduleRef.current();
			return;
		}
		if (document.hidden || !autoriseeRef.current) {
			return;
		}
		if (countRef.current >= RELANCE_DELAYS_MS.length) {
			return;
		}

		fetchingRef.current = true;
		countRef.current += 1;
		try {
			const response = await fetch("/api/relance", {
				body: JSON.stringify({
					derniereBulle: derniereBulleRef.current,
					premierEchange: !hasUserMessageRef.current,
					relanceCount: countRef.current,
					relancesPrecedentes: historiqueRef.current.slice(-HISTORIQUE_MAX),
					sessionId: s.sessionId,
				}),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			});
			const data: RelanceApiResponse = await response.json();
			const paragraphs = Array.isArray(data.message) ? data.message : [];

			if (paragraphs.length > 0) {
				onRelanceRef.current(paragraphs);
				historiqueRef.current.push(...paragraphs);
				derniereBulleRef.current =
					paragraphs.at(-1) ?? derniereBulleRef.current;
			}
			autoriseeRef.current =
				data.relance_autorisee !== false && data.stop !== true;
		} catch {
			autoriseeRef.current = false;
		} finally {
			fetchingRef.current = false;
			scheduleRef.current();
		}
	}, []);

	const schedule = useCallback(() => {
		clearTimer();
		const s = liveRef.current;
		if (!s.enabled || !autoriseeRef.current || fetchingRef.current) {
			return;
		}
		if (s.status === "submitted" || s.status === "streaming") {
			return;
		}
		if (document.hidden || countRef.current >= RELANCE_DELAYS_MS.length) {
			return;
		}
		timerRef.current = setTimeout(fire, RELANCE_DELAYS_MS[countRef.current]);
	}, [clearTimer, fire]);
	scheduleRef.current = schedule;

	// Pourquoi un effet dédié : détecte les *vrais* messages (hors relances)
	// pour mettre à jour le contexte envoyé à n8n et redémarrer un cycle
	useEffect(() => {
		const lastUser = [...messages].reverse().find((m) => m.role === "user");
		if (lastUser && lastUser.id !== lastUserIdRef.current) {
			lastUserIdRef.current = lastUser.id;
			hasUserMessageRef.current = true;
			countRef.current = 0;
		}

		const lastRealAssistant = [...messages]
			.reverse()
			.find((m) => m.role === "assistant" && !getMetadata(m).relance);
		if (
			lastRealAssistant &&
			lastRealAssistant.id !== lastRealAssistantIdRef.current
		) {
			lastRealAssistantIdRef.current = lastRealAssistant.id;
			const paragraphs = paragraphsOf(lastRealAssistant);
			if (paragraphs.length > 0) {
				derniereBulleRef.current =
					paragraphs.at(-1) ?? derniereBulleRef.current;
			}
			autoriseeRef.current =
				getMetadata(lastRealAssistant).relanceAutorisee !== false;
		}
	}, [messages]);

	// Pourquoi cet effet re-planifie systématiquement : ouverture du widget,
	// fin d'une vraie réponse (status → ready), frappe dans le champ, et
	// arrivée d'un nouveau message doivent tous repousser/relancer le minuteur.
	// status/draftValue/messages ne sont pas lus directement ici (schedule()
	// les relit via liveRef) mais doivent bien redéclencher l'effet.
	// biome-ignore lint/correctness/useExhaustiveDependencies: status, draftValue et messages ne sont pas lus dans le corps de l'effet mais doivent le redéclencher (schedule() les relit via liveRef)
	useEffect(() => {
		if (!enabled) {
			clearTimer();
			return;
		}
		schedule();
		return clearTimer;
	}, [enabled, status, draftValue, messages, schedule, clearTimer]);

	// Onglet caché : pause ; onglet visible à nouveau : reprend le compte à rebours
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.hidden) {
				clearTimer();
			} else {
				scheduleRef.current();
			}
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () =>
			document.removeEventListener("visibilitychange", handleVisibilityChange);
	}, [clearTimer]);
}
