"use client";

import { cn } from "@/lib/utils";

interface WaveformBarsProps {
	levels: number[];
	className?: string;
}

export function WaveformBars({ levels, className }: WaveformBarsProps) {
	return (
		<div
			className={cn("flex items-center justify-center gap-0.75 h-6", className)}
			role="img"
			aria-label="Niveau audio en cours d'enregistrement"
		>
			{levels.map((level, i) => (
				<span
					// biome-ignore lint/suspicious/noArrayIndexKey: la liste a une taille fixe et stable (20 barres)
					key={i}
					className="w-0.75 bg-primary rounded-full transition-[height] duration-75 motion-reduce:transition-none"
					style={{ height: `${Math.max(4, level * 24)}px` }}
				/>
			))}
		</div>
	);
}
