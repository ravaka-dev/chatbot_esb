"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useMemo } from "react";

import { cn } from "@/lib/utils";
import { useAutoFocus } from "@/hooks/useAutoFocus";
import { useChatPersistence } from "../../hooks/useChatPersistence";

import { ChatHeader } from "./chat-header";
import { ChatInputForm } from "./chat-input-form";
import { ChatMessageList } from "./chat-message-list";
import { ChatTriggerButton } from "./chat-trigger-button";
import { useSession } from "@/hooks/useSession";

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
	const { textareaRef, focusInput } = useAutoFocus(open, status);

	const isBusy = status === "submitted" || status === "streaming";

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
					"fixed bottom-26 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-100 origin-bottom-right flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-float transition-all duration-200 sm:right-8",
					open
						? "pointer-events-auto translate-y-0 scale-100 opacity-100"
						: "pointer-events-none translate-y-3 scale-95 opacity-0",
				)}
				style={{ height: "min(650px , calc(100vh - 8rem" }}
				role="dialog"
				aria-label="Assistant SEO,GEO et IA ESB"
			>
				<ChatHeader onReset={reset} />
				<ChatMessageList
					messages={messages}
					status={status}
					error={error}
					onSelectSuggestion={send}
				/>
				<ChatInputForm
					value={input}
					onChange={setInput}
					onSubmit={() => send(input)}
					status={status}
					isBusy={isBusy}
					textareaRef={textareaRef}
				/>
			</div>
		</>
	);
}
