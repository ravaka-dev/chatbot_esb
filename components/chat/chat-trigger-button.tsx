import { MessageCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatTriggerButtonProps {
	open: boolean;
	onToggle: () => void;
}

export function ChatTriggerButton({ open, onToggle }: ChatTriggerButtonProps) {
	return (
		<div className="fixed bottom-5 right-5 z-50 sm:bottom-8 sm:right-8">
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						onClick={onToggle}
						size="lg"
						className="h-14 rounded-full px-4 sm:px-10 font-semibold shadow-glow"
						aria-label={
							open ? "Fermer l'assistant ESB" : "Ouvrir l'assistant ESB"
						}
					>
						{open ? (
							<X className="size-5" />
						) : (
							<MessageCircle className="size-5" />
						)}
						<span className="ml-2 hidden sm:inline">
							{open ? "Fermer" : "Ramzi AI"}
						</span>
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>{open ? "Fermer l'assistant" : "Acceder à l'assistant IA"}</p>
				</TooltipContent>
			</Tooltip>
		</div>
	);
}
