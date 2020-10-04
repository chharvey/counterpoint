export type NonemptyArray<T> = readonly [T, ...readonly T[]]


export type EBNFObject = {
	name: string,
	defn: NonemptyArray<EBNFSequence>,
}

export type EBNFSequence = NonemptyArray<EBNFItem>

export type EBNFItem =
	| string
	| { term: string }
	| { prod: string }
