"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Bot, MessageCircle, Trash, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
	Message,
	MessageContent,
	MessageResponse,
} from "@/components/ai-elements/message";
import {
	PromptInput,
	PromptInputFooter,
	PromptInputSubmit,
	PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "esb-seo-chat-v1";

const SUGGESTIONS = [
	"Comment améliorer mon SEO technique ?",
	"C'est quoi le GEO exactement ?",
	"Comment être cité par ChatGPT ?",
	"Créer un agent de prospection IA pour mon entreprise",
];

function loadMessages(): UIMessage[] {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		const parsed = raw ? (JSON.parse(raw) as UIMessage[]) : [];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export function ChatWidget() {
	const [open, setOpen] = useState(false);
	const [input, setInput] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	const { messages, sendMessage, status, error, setMessages } = useChat({
		id: "esb-seo-chat",
		transport: new DefaultChatTransport({ api: "/api/chat" }),
	});

	useEffect(() => {
		const saved = loadMessages();
		if (saved.length > 0) setMessages(saved);
	}, []);

	useEffect(() => {
		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
		} catch (e) {
			throw new Error("Failed to save messages to localStorage");
		}
	}, [messages]);

	const focusInput = useCallback(() => {
		window.setTimeout(() => textareaRef.current?.focus(), 80);
	}, []);

	useEffect(() => {
		if (open) focusInput();
	}, [open, focusInput]);

	useEffect(() => {
		if (status === "ready" && open) focusInput();
	}, [status, open, focusInput]);

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
		try {
			window.localStorage.removeItem(STORAGE_KEY);
		} catch {
			throw new Error("Failed to remove messages from localStorage");
		}
		focusInput();
	};

	return (
		<>
			<div className="fixed bottom-5 right-5 z-50 sm:bottom-8 sm:right-8">
				<Button
					onClick={() => setOpen((v) => !v)}
					size="lg"
					className="h-14 rounded-full px-5 font-semibold shadow-glow"
					aria-label={
						open ? "Fermer l'assistant ESB" : "Ouvrir l'assistant ESB"
					}
				>
					{open ? (
						<X className="size-5" />
					) : (
						<MessageCircle className="size-5" />
					)}
					<span className="ml-2 hidden sm:inline">
						{open ? "Fermer" : "ESB Assistant"}
					</span>
				</Button>
			</div>

			<div
				className={cn(
					"fixed bottom-24 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-100 origin-bottom-right flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-float transition-all duration-200 sm:right-8",
					open
						? "pointer-events-auto translate-y-0 scale-100 opacity-100"
						: "pointer-events-none translate-y-3 scale-95 opacity-0",
				)}
				style={{ height: "min(620px, calc(100vh - 8rem))" }}
				role="dialog"
				aria-label="Assistant SEO, GEO et IA ESB"
			>
				<header className="flex items-center gap-3 border-b border-border bg-secondary/60 px-4 py-3">
					<span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
						<Bot className="size-4" strokeWidth={2.6} />
					</span>
					<div className="min-w-0 flex-1">
						<p className="truncate font-display text-sm font-semibold">
							ESB Assistant
						</p>
						<p className="truncate text-xs text-muted-foreground">
							Chatbot - réponse immédiate
						</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={reset}
						className="text-xs rounded-full text-muted-foreground"
					>
						<Trash className="size-4 text-orange-500 hover:text-orange-900" />
					</Button>
				</header>

				<Conversation className="flex-1">
					<ConversationContent className="gap-4">
						{messages.length === 0 && (
							<div className="space-y-4 py-4">
								<p className="text-sm text-muted-foreground">
									Bonjour 👋 Posez votre question sur le référencement de votre
									site : audit, positionnement Google, visibilité dans les IA
									(ChatGPT, Perplexity, Gemini) ou création d&apos;agents de
									prospection IA.
								</p>
								<div className="flex flex-col gap-2">
									{SUGGESTIONS.map((s) => (
										<button
											key={s}
											type="button"
											onClick={() => send(s)}
											className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-left text-sm transition-colors hover:border-primary/60 hover:bg-secondary"
										>
											{s}
										</button>
									))}
								</div>
							</div>
						)}

						{messages.map((message) => (
							<Message key={message.id} from={message.role}>
								<MessageContent>
									{message.parts.map((part, i) =>
										part.type === "text" ? (
											<MessageResponse key={i}>{part.text}</MessageResponse>
										) : null,
									)}
								</MessageContent>
							</Message>
						))}

						{status === "submitted" && (
							<Shimmer className="text-sm">Analyse en cours...</Shimmer>
						)}
						{error && (
							<p className="text-sm text-destructive">
								Une erreur est survenue. Merci de réessayer dans un instant.
							</p>
						)}
					</ConversationContent>
					<ConversationScrollButton />
				</Conversation>

				<div className="border-t border-border p-3">
					<PromptInput
						onSubmit={(_, event) => {
							event.preventDefault();
							send(input);
						}}
					>
						<PromptInputTextarea
							ref={textareaRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="Votre question SEO ou GEO..."
						/>
						<PromptInputFooter className="justify-end">
							<PromptInputSubmit
								status={status}
								disabled={!input.trim() || isBusy}
							/>
						</PromptInputFooter>
					</PromptInput>
				</div>
			</div>
		</>
	);
}
