"use client";

import { XIcon } from "lucide-react";
import type { RefObject } from "react";
import { useRef, useState } from "react";
import {
	PromptInput,
	PromptInputBody,
	PromptInputInput,
	PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import {
	SpeechInput,
	type SpeechInputHandle,
} from "@/components/ai-elements/speech-input";
import { AnimatedPlaceholder } from "@/components/chat/animated-placeholder";
import { WaveformBars } from "@/components/chat/waveform-bars";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatStatus = "submitted" | "streaming" | "ready" | "error";

const AUDIO_LEVEL_BARS = 20;

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
	const [isRecording, setIsRecording] = useState(false);
	const [audioLevels, setAudioLevels] = useState<number[]>(
		new Array(AUDIO_LEVEL_BARS).fill(0),
	);
	const speechInputRef = useRef<SpeechInputHandle>(null);

	const trimmedValue = value.trim();
	const hasContent = trimmedValue.length > 0;

	return (
		<div className="z-0 px-2 py-4 border-t">
			<PromptInput
				globalDrop
				onSubmit={(_, event) => {
					event.preventDefault();
					onSubmit();
				}}
			>
				<PromptInputBody className="flex justify-between w-full h-fit gap-4 items-center mx-2 rounded-xl border border-gray-200">
					{isRecording && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="order-1 rounded-full size-10 text-muted-foreground hover:bg-white hover:text-destructive"
							onClick={() => speechInputRef.current?.cancel()}
						>
							<XIcon className="size-4" />
							<span className="sr-only">Annuler l'enregistrement</span>
						</Button>
					)}

					{/* Pourquoi ce wrapper : SpeechInput rend son propre conteneur (anneaux
					    de pulsation), donc c'est lui — et non le bouton interne — qui est
					    l'enfant flex dont il faut piloter l'ordre */}
					<div className={cn(isRecording ? "order-3" : "order-1")}>
						<SpeechInput
							ref={speechInputRef}
							lang="fr-FR"
							disabled={isBusy}
							variant="ghost"
							size="icon"
							className="text-white size-10 hover:bg-primary/80"
							onListeningChange={setIsRecording}
							onAudioLevelChange={setAudioLevels}
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
					</div>

					{isRecording ? (
						<WaveformBars levels={audioLevels} className="order-2 flex-1" />
					) : (
						<div className="relative order-2 flex-1">
							{!hasContent && <AnimatedPlaceholder />}
							<PromptInputInput
								ref={inputRef}
								value={value}
								onChange={(e) => onChange(e.target.value)}
								placeholder=""
							/>
						</div>
					)}

					{!isRecording && (
						<PromptInputSubmit
							className="order-3 text-primary size-10 bg-transparent hover:bg-transparent"
							status={status}
							disabled={!trimmedValue || isBusy}
						/>
					)}
				</PromptInputBody>
			</PromptInput>
		</div>
	);
}
