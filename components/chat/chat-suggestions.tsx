const SUGGESTIONS = [
	"Quand seriez-vous disponible pour échanger avec notre expert ? Nous pouvons organiser un rendez-vous selon vos disponibilités."
];

interface ChatSuggestionsProps {
	onSelect: (suggestion: string) => void;
}

export function ChatSuggestions({ onSelect }: ChatSuggestionsProps) {
	return (
		<div className="space-y-4 py-4">
			<p className="text-sm text-muted-foreground">
			Bonjour 👋<br /><br />
			Je suis Ramzi AI, l’assistant de Ramzi, expert en SEO &amp; GEO.<br />
			Votre site peut avoir du potentiel sans que vous sachiez exactement quoi améliorer, pourquoi votre visibilité stagne ou comment être mieux référencé sur Google et les moteurs de recherche IA.<br /><br />
			🎯 Mon rôle est simple : comprendre votre situation et vous mettre en relation avec Ramzi, afin que vous puissiez bénéficier de conseils adaptés à votre projet.<br /><br />
			📅 Prenez rendez-vous avec notre expert et échangez sur votre site, vos objectifs et les opportunités d'amélioration.<br />
			Je peux vous aider à organiser votre rendez-vous dès maintenant. 🤝
			</p>
			<div className="flex flex-col gap-2">
				{SUGGESTIONS.map((s) => (
					<button
						key={s}
						type="button"
						onClick={() => onSelect(s)}
						className="rounded-xl border border-border bg-secondary px-3 py-2 text-left text-sm transition-colors hover:border-primary/60 hover:bg-secondary"
					>
						{s}
					</button>
				))}
			</div>
		</div>
	);
}
