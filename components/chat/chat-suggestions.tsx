const SUGGESTIONS = [
	"Comment améliorer mon SEO technique ?",
	"C'est quoi le GEO exactement ?",
	"Comment être cité par ChatGPT ?",
	"Créer un agent de prospection IA pour mon entreprise",
];

interface ChatSuggestionsProps{
    onSelect : (suggestion: string) => void
}

export function ChatSuggestions({onSelect}:ChatSuggestionsProps){
    return (
        <div className="space-y-4 py-4">
            <p className="text-sm text-center text-muted-foreground">
                Bonjour 👋 Posez votre question sur le référencement de votre site :
				audit, positionnement Google, visibilité dans les IA ou création d&apos;agents de prospection IA.
            </p>
            <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((s)=>(
                    <button key={s} type="button" onClick={()=>onSelect(s)} className='rounded-xl border border-border bg-secondary px-3 py-2 text-left text-sm transition-colors hover:border-primary/60 hover:bg-secondary'>
                        {s}
                    </button>
                ))}
            </div>
        </div>
    )
}