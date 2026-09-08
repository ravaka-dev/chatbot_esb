"use client";

import { useEffect, useState } from "react";

interface ChromePaddingConfig {
	chrome: string;
	default: string;
}

export function useBrowserPadding(config: ChromePaddingConfig): string {
	const [padding, setPadding] = useState<string>(config.default);

	useEffect(() => {
		const userAgent = navigator.userAgent.toLocaleLowerCase();

		const isChrome =
			userAgent.includes("chrome") &&
			!userAgent.includes("edg/") &&
			!userAgent.includes("opr/");

		if (isChrome) {
			setPadding(config.chrome);
		}
	}, [config.chrome]);

	return padding;
}
