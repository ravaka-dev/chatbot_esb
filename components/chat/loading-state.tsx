import type { ChatStatus } from "ai";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Ramzi from "@/public/icons/Avatar Ramzi.png";
import { Shimmer } from "../ai-elements/shimmer";

interface LoadingStateProps {
	status: ChatStatus;
}

function LoadingState({ status }: LoadingStateProps) {
	return (
		status === "submitted" && (
			<div className="flex items-center gap-2 py-2">
				<Avatar className="size-4">
					<AvatarImage src={Ramzi.src} alt="Ramzi IA" />
					<AvatarFallback>R</AvatarFallback>
				</Avatar>
				<Shimmer className="text-xs">Ramzi IA est en train de répondre</Shimmer>
			</div>
		)
	);
}

export default LoadingState;
