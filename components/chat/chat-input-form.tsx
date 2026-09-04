import { Mic } from "lucide-react";
import type { RefObject } from "react";
import {
	PromptInput,
	PromptInputBody,
	PromptInputFooter,
	PromptInputInput,
	PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { SpeechInput } from "@/components/ai-elements/speech-input";

type ChatStatus = "submitted" | "streaming" | "ready" | "error";

interface ChatInputFormProps {
	value: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
	status: ChatStatus;
	isBusy: boolean;
	inputRef: RefObject<HTMLInputElement | null>;
}

export function ChatInputForm({
	value,
	onChange,
	onSubmit,
	status,
	isBusy,
	inputRef,
}: ChatInputFormProps) {
	const trimmedValue = value.trim();
	const hasContent = trimmedValue.length > 0;

	return (
		<div className="z-0 px-4">
			<PromptInput
				globalDrop
				onSubmit={(_, event) => {
					event.preventDefault();
					onSubmit();
				}}
			>
				<PromptInputBody className="flex justify-between w-full h-fit gap-4 items-center mx-2 rounded-xl border border-gray-200">
					<SpeechInput
						lang="fr-FR"
						disabled={isBusy}
						variant="ghost"
						size="icon"
						className="text-white size-10 hover:bg-primary/80"
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
							onChange(trimmedValue ? `${trimmedValue} ${text}` : text);
							inputRef.current?.focus();
						}}
					/>
					<PromptInputInput
						ref={inputRef}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder="Ecrire ici ..."
					/>
					<PromptInputSubmit
						className="text-primary size-10 bg-transparent hover:bg-transparent"
						status={status}
						disabled={!trimmedValue || isBusy}
					/>
				</PromptInputBody>
				<PromptInputFooter className="w-full p-0 flex justify-center">
					<p
						className={`py-3 text-center text-xs text-gray-500 motion-reduce:animate-none ${
							hasContent ? "py-5" : "animate-pulse"
						}`}
					>
						{hasContent ? "" : "Tu peux aussi utiliser le micro."}
					</p>
					{!hasContent && <Mic className="text-primary" />}
				</PromptInputFooter>
			</PromptInput>
		</div>
	);
}
