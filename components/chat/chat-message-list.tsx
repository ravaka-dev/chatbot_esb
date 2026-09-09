import type { UIMessage } from "ai";
import { Loader } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { useWaitingMessage } from "@/hooks/useWaitingMessage";
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
	const _padding = useBrowserPadding({
		chrome: "0",
		default: "4",
	});
	const waiting = useWaitingMessage(status === "submitted");
	const [animatedMessageId, setAnimatedMessageId] = useState<string | null>(
		null,
	);
	const [isAnimationDone, setIsAnimationDone] = useState(false);
	// Pourquoi : seuls les messages reçus pendant cette session sont animés —
	// ceux restaurés du localStorage ne doivent pas rejouer l'effet de frappe
	// à chaque rechargement de la page
	const hasSubmittedRef = useRef(false);

	useEffect(() => {
		if (status === "submitted") {
			hasSubmittedRef.current = true;
		}

		const lastMessage = messages[messages.length - 1];
		if (!hasSubmittedRef.current || lastMessage?.role !== "assistant") {
			return;
		}
		if (lastMessage.id === animatedMessageId) {
			return;
		}

		setAnimatedMessageId(lastMessage.id);
		setIsAnimationDone(false);
	}, [status, messages, animatedMessageId]);

	return (
		<Conversation className="flex-1">
			<ConversationContent className={`my-4 mx-${_padding} gap-4`}>
				{messages.length === 0 ? (
					<ChatSuggestions isAnimated />
				) : (
					<ChatSuggestions isAnimated={false} />
				)}

				{messages.map((message, index) => {
					const textParts = message.parts
						.filter((part) => part.type === "text")
						.map((part) => part.text);
					const isStreamingThisMessage =
						message.role === "assistant" &&
						index === messages.length - 1 &&
						status === "streaming";
					const isAnimatedMessage = message.id === animatedMessageId;

					return (
						<Message key={message.id} from={message.role}>
							{message.role === "assistant" ? (
								<MessageParagraphs
									isAnimated={isAnimatedMessage}
									onAnimationComplete={() => setIsAnimationDone(true)}
									paragraphs={textParts}
								/>
							) : (
								<MessageContent>
									<MessageResponse>{textParts.join("")}</MessageResponse>
								</MessageContent>
							)}
							{message.role === "assistant" &&
								!isStreamingThisMessage &&
								(!isAnimatedMessage || isAnimationDone) && (
									<MessageMeta name="Ramzi IA" roleLabel="Agent IA" />
								)}
						</Message>
					);
				})}

				{status === "submitted" &&
					waiting &&
					(waiting.level === 3 ? (
						<div className="flex flex-col gap-1">
							{waiting.paragraphs.map((paragraph) => (
								<Shimmer className="text-xs font-semibold" key={paragraph}>
									{paragraph}
								</Shimmer>
							))}
						</div>
					) : waiting.level === 2 ? (
						<div className="flex items-center font-semibold gap-2">
							<Shimmer className="text-xs">{waiting.paragraphs[0]}</Shimmer>
							<Loader className="size-4 animate-spin text-muted-foreground" />
						</div>
					) : (
						<div className="flex font-semibold gap-2">
							<Shimmer className="text-xs">{waiting.paragraphs[0]}</Shimmer>
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
