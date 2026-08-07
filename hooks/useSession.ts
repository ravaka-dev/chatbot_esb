import { useState } from "react";

function getOrCreateSessionId(storageKey: string): string {
	const sessionKey = `${storageKey}_session_id`;
	try {
		let sessionId = window.localStorage.getItem(sessionKey);
		if (!sessionId) {
			sessionId = crypto.randomUUID();
			window.localStorage.setItem(sessionKey, sessionId);
		}
		return sessionId;
	} catch {
		return crypto.randomUUID();
	}
}

export function useSession(storageKey: string) {
	const [sessionId, setSessionId] = useState<string>(() =>
		getOrCreateSessionId(storageKey),
	);

	const regenerate = () => {
		const newId = crypto.randomUUID();
		try {
			window.localStorage.setItem(`${storageKey}_session_id`, newId);
		} catch {
			setSessionId(newId);
		}
	};
	return { sessionId, regenerate };
}
