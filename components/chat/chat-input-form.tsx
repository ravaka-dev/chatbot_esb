import type { RefObject } from "react";
import {
	PromptInput,
	PromptInputBody,
	PromptInputFooter,
	PromptInputSubmit,
	PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { SpeechInput } from "@/components/ai-elements/speech-input";

type ChatStatus = "submitted" | "streaming" | "ready" | "error";

interface ChatInputFormProps {
	value: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
	status: ChatStatus;
	isBusy: boolean;
	textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export function ChatInputForm({
	value,
	onChange,
	onSubmit,
	status,
	isBusy,
	textareaRef,
}: ChatInputFormProps) {
	return (
		<div className="border-t border-border p-3">
			<PromptInput
				globalDrop
				onSubmit={(_, event) => {
					event.preventDefault();
					onSubmit();
				}}
			>
				<PromptInputBody>
					<PromptInputTextarea
						ref={textareaRef}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder="Ecrire ici ..."
					/>
				</PromptInputBody>
				<PromptInputFooter className="justify-between">
					<SpeechInput
						lang="fr-FR"
						disabled={isBusy}
						variant="ghost"
						size="icon"
						className="text-muted-foreground"
						onAudioRecorded={async (audioBlob) => {
							const formData = new FormData();
							formData.append("file", audioBlob, "audio.webm");

							const response = await fetch("/api/transcribe", {
								method: "POST",
								body: formData,
							});

							if (!response.ok) {
								const { error } = await response
									.json()
									.catch(() => ({ error: "Erreur inconnue" }));
								throw new Error(error);
							}

							const { text } = await response.json();
							return text;
						}}
						onTranscriptionChange={(text) => {
							onChange(value.trim() ? `${value.trim()} ${text}` : text);
							textareaRef.current?.focus();
						}}
					/>
					<PromptInputSubmit
						status={status}
						disabled={!value.trim() || isBusy}
					/>
				</PromptInputFooter>
			</PromptInput>
		</div>
	);
}
