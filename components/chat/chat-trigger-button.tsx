import { X, MessageCircle } from "lucide-react";
import Image from "next/image";
import RamziImage from "@/public/icons/Avatar Ramzi.png";
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
		<>
			<style>{`
				@keyframes ramzi-float {
					0%, 100% { transform: translateY(0px) rotate(-3deg); }
					50% { transform: translateY(-12px) rotate(3deg); }
				}
				@keyframes ramzi-halo {
					0%, 100% { transform: scale(1); opacity: 0.55; }
					50% { transform: scale(1.15); opacity: 0.85; }
				}
			`}</style>

			<div className="fixed bottom-5 right-5 z-50 sm:bottom-8 sm:right-8">
				<Tooltip permanent={!open}>
					<TooltipTrigger asChild>
						<button
							onClick={onToggle}
							aria-label={
								open ? "Fermer l'assistant ESB" : "Ouvrir l'assistant ESB"
							}
							className="relative group"
						>
							{/* glowing halo */}
							<span
								className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklch,var(--primary)_90%,transparent),color-mix(in_oklch,var(--primary)_40%,transparent)_45%,transparent_70%)] blur-2xl"
								style={{ animation: "ramzi-halo 3s ease-in-out infinite" }}
							/>
							{/* orbit ring */}
							<span className="absolute inset-2 rounded-full border border-primary/40 mask-[linear-gradient(transparent,black)]" />

							{open ? (
								<span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary backdrop-blur-md border border-primary/50 shadow-[0_0_30px_var(--primary)]">
									<X className="h-6 w-6 text-white" />
								</span>
							) : (
								<span
									className="relative block h-20 w-20 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_10px_25px_color-mix(in_oklch,var(--primary)_55%,transparent)]"
									style={{ animation: "ramzi-float 5s ease-in-out infinite" }}
								>
									<Image
										src={RamziImage}
										alt="Assistant IA"
										fill
										sizes="auto"
										priority
										className="object-contain select-none rounded-full border-3 border-primary text pointer-events-none"
										draggable={false}
									/>
								</span>
							)}
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p>{open ? "Fermer l'assistant" : "Cliquez ici - Ramzi IA"}</p>
					</TooltipContent>
				</Tooltip>
			</div>
		</>
	);
}
