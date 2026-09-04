"use client";

import { SquareIcon, XIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RECORDING_DOTS = Array.from({ length: 24 }, (_, index) => index);

export type SpeechRecordingBarProps = ComponentProps<"div"> & {
	onCancel: () => void;
	onStop: () => void;
};

// Pourquoi : remplace tout le contenu du champ de saisie pendant
// l'enregistrement (annuler / indicateur / arrêter), plutôt que de garder
// l'input texte visible à côté d'un simple bouton
export function SpeechRecordingBar({
	onCancel,
	onStop,
	className,
	...props
}: SpeechRecordingBarProps) {
	return (
		<div className={cn("flex w-full items-center gap-3", className)} {...props}>
			<Button
				aria-label="Annuler l'enregistrement"
				className="size-8 shrink-0 rounded-full text-muted-foreground hover:bg-transparent hover:text-foreground"
				onClick={onCancel}
				size="icon"
				type="button"
				variant="ghost"
			>
				<XIcon className="size-5" />
			</Button>
			<div
				aria-hidden="true"
				className="flex min-w-0 flex-1 items-center gap-1"
			>
				{RECORDING_DOTS.map((dot) => (
					<span
						className="h-1 w-1 shrink-0 animate-pulse rounded-full bg-muted-foreground/50"
						key={dot}
						style={{ animationDelay: `${dot * 60}ms` }}
					/>
				))}
			</div>
			<Button
				aria-label="Arrêter et envoyer"
				className="size-9 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/80"
				onClick={onStop}
				size="icon"
				type="button"
			>
				<SquareIcon className="size-4" />
			</Button>
		</div>
	);
}
