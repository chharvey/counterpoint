export enum CompletionKind {
	NORMAL,
	BREAK_OR_SKIP,
	RETURN_OR_THROW,
}


export function CompletionKind_min(kinds: readonly CompletionKind[]): CompletionKind {
	return Math.min(...kinds);
}



export function CompletionKind_max(kinds: readonly CompletionKind[]): CompletionKind {
	return Math.max(...kinds);
}
