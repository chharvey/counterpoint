export type NonemptyArray<T> = readonly [T, ...readonly T[]]


export type EBNFObject = {
	readonly name: string,
	readonly defn: EBNFChoice,
}

export type EBNFChoice = NonemptyArray<EBNFSequence>

export type EBNFSequence = NonemptyArray<EBNFItem>

export type EBNFItem =
	| string
	| { readonly term: string }
	| { readonly prod: string }


/**
 * A code point is a number within [0, 0x10_ffff] that represents
 * the index of a character in the Unicode Universal Character Set.
 */
export type CodePoint = number;

/**
 * A code unit is a number within [0, 0xff] that represents
 * a byte of an encoded Unicode code point.
 */
export type CodeUnit = number;

/**
 * An encoded character is a sequence of code units
 * that corresponds to a single code point in the UTF-8 encoding.
 */
export type EncodedChar =
	| [CodeUnit]
	| [CodeUnit, CodeUnit]
	| [CodeUnit, CodeUnit, CodeUnit]
	| [CodeUnit, CodeUnit, CodeUnit, CodeUnit]
;
