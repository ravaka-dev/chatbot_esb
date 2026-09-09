"use client";

import { cn } from "@/lib/utils";

interface WaveformBarsProps {
	levels: number[];
	className?: string;
}

const MIN_BAR_HEIGHT = 4;
const MAX_BAR_HEIGHT = 28;

export function WaveformBars({ levels, className }: WaveformBarsProps) {
	return (
		<div
			className={cn(
				"flex h-9 items-center justify-center gap-1 rounded-full bg-muted/60 px-4",
				className,
			)}
			role="img"
			aria-label="Niveau audio en cours d'enregistrement"
		>
			{levels.map((level, i) => {
				const height = Math.max(MIN_BAR_HEIGHT, level * MAX_BAR_HEIGHT);
				const opacity = 0.45 + level * 0.55;

				return (
					<span
						// biome-ignore lint/suspicious/noArrayIndexKey: la liste a une taille fixe et stable (20 barres)
						key={i}
						className="w-0.75 shrink-0 rounded-full bg-primary transition-[height,opacity] duration-100 ease-out motion-reduce:transition-none"
						style={{ height: `${height}px`, opacity }}
					/>
				);
			})}
		</div>
	);
}
