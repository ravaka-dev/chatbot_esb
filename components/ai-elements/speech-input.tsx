"use client";

import { MicIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type SpeechInputProps = ComponentProps<typeof Button> & {
	isProcessing?: boolean;
};

// Pourquoi : bouton déclencheur uniquement — l'état d'enregistrement vit
// dans useSpeechRecorder, géré par le parent (voir SpeechRecordingBar pour
// l'UI affichée pendant l'enregistrement)
export const SpeechInput = ({
	className,
	isProcessing,
	"aria-label": ariaLabel = "Enregistrer un message vocal",
	...props
}: SpeechInputProps) => (
	<Button
		aria-label={ariaLabel}
		className={cn(
			"rounded-full bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/80 hover:text-primary-foreground",
			className,
		)}
		type="button"
		{...props}
	>
		{isProcessing ? <Spinner /> : <MicIcon className="size-4" />}
	</Button>
);
