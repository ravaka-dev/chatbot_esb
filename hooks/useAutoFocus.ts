// hooks/useAutoFocus.ts
import { useCallback, useEffect, useRef } from "react";

type ChatStatus = "submitted" | "streaming" | "ready" | "error";

type FocusableElement = HTMLInputElement | HTMLTextAreaElement;

export function useAutoFocus<T extends FocusableElement = HTMLInputElement>(
	open: boolean,
	status: ChatStatus,
) {
	const inputRef = useRef<T | null>(null);

	const focusInput = useCallback(() => {
		window.setTimeout(() => inputRef.current?.focus(), 80);
	}, []);

	useEffect(() => {
		if (open) focusInput();
	}, [open, focusInput]);

	useEffect(() => {
		if (status === "ready" && open) focusInput();
	}, [status, open, focusInput]);

	return { inputRef, focusInput };
}
