export type KleenePlus<T> = readonly [T, ...readonly T[]]


export type EBNFObject = {
	name: string,
	defn: KleenePlus<EBNFSequence>,
}

export type EBNFSequence = KleenePlus<EBNFItem>

export type EBNFItem =
	| string
	| { term: string }
	| { prod: string }
