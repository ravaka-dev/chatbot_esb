import { Bot, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatHeaderProps {
	onReset: () => void;
}

export function ChatHeader({ onReset }: ChatHeaderProps) {
	return (
		<header className="flex items-center gap-3 border-b border-border bg-secondary/60 px-4 py-3">
			<span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
				<Bot className="size-4" strokeWidth={2.6} />
			</span>
			<div className="min-w-0 flex-1">
				<p className="truncate font-display text-sm font-semibold">
					ESB assistant
				</p>
				<p className="truncate text-xs text-muted-foreground">
					ChatBot - reponse immediate
				</p>
			</div>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						onClick={onReset}
						className="text-xs rounded-full text-muted-foreground"
					>
						<Trash className="size-4 text-orange-500 hover:text-orange-900" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>Effacer les messages</p>
				</TooltipContent>
			</Tooltip>
		</header>
	);
}
