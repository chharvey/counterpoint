export type KleenePlus<T> = readonly [T, ...readonly T[]]


export type EBNFObject = {
	readonly name: string,
	readonly defn: KleenePlus<EBNFSequence>,
}

export type EBNFChoice = KleenePlus<EBNFSequence>

export type EBNFSequence = KleenePlus<EBNFItem>

export type EBNFItem =
	| string
	| { readonly term: string }
	| { readonly prod: string }
