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
import { useBrowserPadding } from "@/hooks/useBrowserPadding";
import { ChatSuggestions } from "./chat-suggestions";

type ChatStatus = "submitted" | "streaming" | "ready" | "error";

interface ChatMessageListProps {
	messages: UIMessage[];
	status: ChatStatus;
	error: Error | undefined;
}

const LONG_PROCESSING_DELAY = 20000;

export function ChatMessageList({
	messages,
	status,
	error,
}: ChatMessageListProps) {
	const [isLongProcessing, setIsLongProcessing] = useState(false);
	const _padding = useBrowserPadding({
		chrome: "0",
		default: "4",
	});

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
			<ConversationContent className={`my-4 mx-${_padding} gap-4`}>
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
						<div className="flex itemp-center font-semibold gap-2">
							<Shimmer className="text-xs">Traitement en cours</Shimmer>
							<Loader className="size-4 animate-spin text-muted-foreground" />
						</div>
					) : (
						<div className="flex font-semibold gap-2">
							<Shimmer className="text-xs">
								Ramzi IA est en train de d'écrire
							</Shimmer>
							<div className="flex items-center gap-1">
								<span className="size-2 text-gray-600 animate-bounce rounded-full bg-current [animation-delay:-0.6s]" />
								<span className="size-2 text-gray-400 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
								<span className="size-2 text-gray-200 animate-bounce rounded-full bg-current border" />
							</div>
						</div>
					))}

				{error && (
					<Shimmer className="text-xs text-destructive">
						Une erreur est survenue. Merci de réessayer dans un instant.
					</Shimmer>
				)}
			</ConversationContent>
			<ConversationScrollButton />
		</Conversation>
	);
}
