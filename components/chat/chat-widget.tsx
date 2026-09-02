"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useState } from "react";
import { useAutoFocus } from "@/hooks/useAutoFocus";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";
import { useChatPersistence } from "../../hooks/useChatPersistence";
import { ChatHeader } from "./chat-header";
import { ChatInputForm } from "./chat-input-form";
import { ChatMessageList } from "./chat-message-list";
import { ChatTriggerButton } from "./chat-trigger-button";

const STORAGE_KEY = "esb-seo-chat";

export function ChatWidget() {
	const [open, setOpen] = useState(false);
	const [input, setInput] = useState("");
	const { sessionId, regenerate } = useSession(STORAGE_KEY);

	const { messages, sendMessage, status, error, setMessages } = useChat({
		id: STORAGE_KEY,
		transport: useMemo(
			() => new DefaultChatTransport({ api: "/api/chat", body: { sessionId } }),
			[sessionId],
		),
	});

	const { clear } = useChatPersistence(STORAGE_KEY, messages, setMessages);
	const { inputRef, focusInput } = useAutoFocus<HTMLInputElement>(open, status);
	const isBusy = status === "submitted" || status === "streaming";

	useEffect(() => {
		const timer = setTimeout(() => setOpen(true), 200);
		// Pourquoi : laisse le premier rendu (fermé) être peint avant de basculer,
		// sinon la transition CSS n'a rien à animer
		return () => clearTimeout(timer);
	}, []);

	const send = (text: string) => {
		const value = text.trim();
		if (!value || isBusy) return;
		setInput("");
		void sendMessage({ text: value });
		focusInput();
	};

	const reset = () => {
		setMessages([]);
		clear();
		regenerate();
		focusInput();
	};

	return (
		<>
			<ChatTriggerButton open={open} onToggle={() => setOpen((v) => !v)} />
			<div
				className={cn(
					"fixed bottom-26 overflow-hidden right-4 z-50 flex w-[calc(100vw-2rem)] max-w-100 origin-bottom-right flex-col overflow-hiddebn rounded-2xl border border-border bg-card shadow-float transition-all duration-300 sm:right-8",
					open
						? "pointer-events-auto translate-y-0 scale-100 opacity-100"
						: "pointer-events-none translate-y-3 scale-95 opacity-0",
				)}
				style={{ height: "min(650px , calc(100vh - 8rem" }}
				role="dialog"
				aria-label="Ramzi Ai, ESB"
			>
				<ChatHeader onReset={reset} />
				<ChatMessageList messages={messages} status={status} error={error} />
				<ChatInputForm
					value={input}
					onChange={setInput}
					onSubmit={() => send(input)}
					status={status}
					isBusy={isBusy}
					inputRef={inputRef}
				/>
			</div>
		</>
	);
}
