const SUGGESTIONS = [
	"Quels sont les disponibilités , pour contacter vos experts pour un rendez-vous?",
];

interface ChatSuggestionsProps {
	onSelect: (suggestion: string) => void;
}

export function ChatSuggestions({ onSelect }: ChatSuggestionsProps) {
	return (
		<div className="space-y-4 py-4">
			<p className="text-sm text-muted-foreground">
				Bonjour 👋 Je suis Ramzi, l&apos;agent IA spécialisé en SEO & GEO : je fais le point sur la visibilité de votre site et vous mets en relation avec nos spécialistes pour des conseils personnalisés et la prise de rendez-vous.
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
