import { Trash } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

import RamziImage from "@/public/icons/Avatar Ramzi.png";

interface ChatHeaderProps {
	onReset: () => void;
	messagesCount: number;
}

function ResetButton({
	onReset,
	variant,
}: {
	onReset: () => void;
	variant: "compact" | "hero";
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					onClick={onReset}
					className={
						variant === "hero"
							? "rounded-full text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
							: "rounded-full text-xs text-muted-foreground"
					}
				>
					<Trash
						className={
							variant === "hero"
								? "size-4"
								: "size-4 text-orange-500 hover:text-orange-900"
						}
					/>
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>Effacer les messages</p>
			</TooltipContent>
		</Tooltip>
	);
}

export function ChatHeader({ onReset, messagesCount }: ChatHeaderProps) {
	if (messagesCount === 0) {
		return (
			<header className="flex flex-row items-center justify-between px-8 gap-10 bg-linear-to-r from-primary/65 to-primary/90 py-6 text-primary-foreground">
				<div>
					<p className="font-display text-xl font-semibold">Ramzi IA</p>
					<p className="truncate text-xs text-white">Votre assistant IA</p>
				</div>
				<div>
					<span className="flex size-15 items-center justify-center overflow-hidden animate-[pulse_2s_ease-in-out_infinite] rounded-full bg-white ring-8 ring-primary-foreground/10">
						{" "}
						<Image
							src={RamziImage}
							alt="Photo de Ramzi"
							sizes="auto"
							className="object-contain rounded-full"
							loading="eager"
						/>
					</span>
				</div>
			</header>
		);
	}

	return (
		<header className="relative flex items-center gap-3 bg-secondary/60 px-4 py-3">
			<span className="flex size-12 items-center justify-center bg-transparent text-primary-foreground">
				<Image
					src={RamziImage}
					alt="Photo de Ramzi"
					sizes="auto"
					className="object-contain rounded-full"
					loading="eager"
				/>
			</span>
			<div className="min-w-0 flex-1">
				<p className="truncate font-display text-sm font-semibold">Ramzi IA</p>
				<p className="truncate text-xs text-muted-foreground">
					Votre assistant IA
				</p>
			</div>
			<ResetButton onReset={onReset} variant="compact" />
			<span
				aria-hidden
				className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-border to-transparent"
			/>
		</header>
	);
}
