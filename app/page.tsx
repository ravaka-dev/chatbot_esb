import type { Metadata } from "next";
import { ChatWidget } from "@/components/chat/chat-widget";

export const metadata: Metadata = {
	title: "ESB — Assistant SEO & GEO pour votre site web",
	description:
		"ESB répond à vos questions SEO et GEO : référencement Google, visibilité dans ChatGPT et Perplexity, audit technique, stratégie de contenu et création d'agents de prospection IA pour augmenter vos clients.",
	openGraph: {
		title: "ESB — Assistant SEO & GEO",
		description:
			"Posez vos questions de référencement naturel, de visibilité dans les moteurs IA et de création d'agents de prospection IA à l'assistant ESB.",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
	},
};

export default function Index() {
	return (
		<div className="min-h-screen bg-hero pt-4">
			<ChatWidget />
		</div>
	);
}
