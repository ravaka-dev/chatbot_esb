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
	onSelectSuggestion: (suggestion: string) => void;
}

export function ChatMessageList({
	messages,
	status,
	error,
	onSelectSuggestion,
}: ChatMessageListProps) {
	return (
		<Conversation className="flex-1">
			<ConversationContent className="gap-4">
				{messages.length === 0 && (
					<ChatSuggestions onSelect={onSelectSuggestion} />
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
	);
}
