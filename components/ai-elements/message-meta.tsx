"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type MessageMetaProps = HTMLAttributes<HTMLParagraphElement> & {
	name: string;
	roleLabel: string;
};

// Pourquoi : légende (émetteur • rôle) affichée sous une bulle de message assistant
export function MessageMeta({ name, roleLabel, className, ...props }: MessageMetaProps) {
	return (
		<p className={cn("px-1 font-semibold text-[11px] text-muted-foreground", className)} {...props}>
			{name} • {roleLabel}
		</p>
	);
}
