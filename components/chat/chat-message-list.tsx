import type { UIMessage } from "ai";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
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
import { MessageMeta } from "@/components/ai-elements/message-meta";
import { MessageParagraphs } from "@/components/ai-elements/message-paragraphs";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ChatSuggestions } from "./chat-suggestions";

type ChatStatus = "submitted" | "streaming" | "ready" | "error";

interface ChatMessageListProps {
	messages: UIMessage[];
	status: ChatStatus;
	error: Error | undefined;
}

const LONG_PROCESSING_DELAY = 10000;

export function ChatMessageList({
	messages,
	status,
	error,
}: ChatMessageListProps) {
	const [isLongProcessing, setIsLongProcessing] = useState(false);

	useEffect(() => {
		if (status !== "submitted") {
			setIsLongProcessing(false);
			return;
		}

		const timer = setTimeout(() => {
			setIsLongProcessing(true);
		}, LONG_PROCESSING_DELAY);

		return () => clearTimeout(timer);
	}, [status]);

	return (
		<Conversation className="flex-1">
			<ConversationContent className="my-4 gap-4">
				{messages.length === 0 && <ChatSuggestions />}

				{messages.map((message, index) => {
					const textParts = message.parts
						.filter((part) => part.type === "text")
						.map((part) => part.text);
					const isStreamingThisMessage =
						message.role === "assistant" &&
						index === messages.length - 1 &&
						status === "streaming";

					return (
						<Message key={message.id} from={message.role}>
							{message.role === "assistant" ? (
								<MessageParagraphs
									isStreaming={isStreamingThisMessage}
									paragraphs={textParts}
								/>
							) : (
								<MessageContent>
									<MessageResponse>{textParts.join("")}</MessageResponse>
								</MessageContent>
							)}
							{message.role === "assistant" && !isStreamingThisMessage && (
								<MessageMeta name="Ramzi IA" roleLabel="Agent IA" />
							)}
						</Message>
					);
				})}

				{status === "submitted" &&
					(isLongProcessing ? (
						<div className="flex items-center gap-2">
							<Loader className="size-4 animate-spin text-muted-foreground" />
							<Shimmer className="text-sm">Traitement en cours</Shimmer>
						</div>
					) : (
						<div className="flex items-center gap-1">
							<span className="size-3 text-primary animate-bounce rounded-full bg-current [animation-delay:-0.4s]" />
							<span className="size-3 text-primary/80 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
							<span className="size-3 text-primary/60 animate-bounce rounded-full bg-current" />
						</div>
					))}

				{error && (
					<Shimmer className="text-sm text-destructive">
						Une erreur est survenue. Merci de réessayer dans un instant.
					</Shimmer>
				)}
			</ConversationContent>
			<ConversationScrollButton />
		</Conversation>
	);
}
