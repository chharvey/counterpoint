import type {NonemptyArray} from './package.js';



/** Characters representing bounds of a file. */
export enum Filebound {
	/** U+0002 START OF TEXT */
	SOT = '\u0002',
	/** U+0003 END OF TEXT */
	EOT = '\u0003',
}



export enum TemplatePosition {
	FULL,
	HEAD,
	MIDDLE,
	TAIL,
}



export type EBNFObject = {
	/** The name of the production. */
	readonly name: string,
	/** The production definition. */
	readonly defn: EBNFChoice,
	/**
	 * If `true`, this production is a family group, an abstract superclass.
	 * If a string, the name of the family that this production extends.
	 * Else, this is not a fmaily group nor does it belong to one.
	 */
	readonly family?: boolean | string,
};

export type EBNFChoice = Readonly<NonemptyArray<EBNFSequence>>;

export type EBNFSequence = Readonly<NonemptyArray<EBNFItem>>;

export type EBNFItem =
	| string
	| { readonly term: string }
	| { readonly prod: string }
;
