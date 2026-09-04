export type BubblePosition = "first" | "other";

// Pourquoi : bulles d'un même message groupées visuellement en un seul bloc →
// seule la première a le côté gauche arrondi (coin haut-gauche), les
// suivantes ont le côté gauche entièrement carré pour rester collées au
// bloc ; le côté droit reste arrondi sur toutes les bulles.
export function bubbleRadiusClass(position: BubblePosition) {
	return position === "first"
		? "rounded-lg rounded-bl-none"
		: "rounded-r-lg rounded-l-none";
}

export function paragraphPosition(index: number): BubblePosition {
	return index === 0 ? "first" : "other";
}
