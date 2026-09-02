import type { UIMessage } from "ai";
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
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ChatSuggestions } from "./chat-suggestions";

type ChatStatus = "submitted" | "streaming" | "ready" | "error";

interface ChatMessageListProps {
	messages: UIMessage[];
	status: ChatStatus;
	error: Error | undefined;
}

export function ChatMessageList({
	messages,
	status,
	error,
}: ChatMessageListProps) {
	return (
		<Conversation className="flex-1">
			<ConversationContent className="gap-4">
				{messages.length === 0 && <ChatSuggestions />}

				{messages.map((message) => (
					<Message key={message.id} from={message.role}>
						<MessageContent>
							{message.parts.map((part) =>
								part.type === "text" ? (
									<MessageResponse key={message.id}>
										{part.text}
									</MessageResponse>
								) : null,
							)}
						</MessageContent>
					</Message>
				))}

				{status === "submitted" && (
					<div className="flex items-center gap-1">
						<span className="size-3 text-primary animate-bounce rounded-full bg-current [animation-delay:-0.4s]" />
						<span className="size-3 text-primary/80 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
						<span className="size-3 text-primary/60 animate-bounce rounded-full bg-current" />
					</div>
				)}

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
