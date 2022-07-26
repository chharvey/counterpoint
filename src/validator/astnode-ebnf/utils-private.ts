import type {
	ASTNodeParam,
	ASTNodeArg,
	ASTNodeCondition,
} from './index.js';



export type Mutable<T> = {
	-readonly [P in keyof T]: T[P];
};



export const PARAM_SEPARATOR: '_'  = '_';
export const SUB_SEPARATOR:   '__' = '__';
export const FAMILY_SYMBOL:   '$'  = '$';



export class ConcreteNonterminal {
	/** A counter for internal sub-expressions. Used for naming automated productions. */
	private sub_count: bigint = 0n;

	constructor (
		readonly name: string,
		readonly suffixes: ASTNodeParam[] = [],
	) {
	}

	/**
	 * Generate a new name for a sublist of this ConcreteNonterminal,
	 * incrementing its sub-expression counter each time.
	 * @return a new name for a list containing this ConcreteNonterminal’s current sub-expression counter
	 */
	get newSubexprName(): string {
		return `${ this }${ SUB_SEPARATOR }${ this.sub_count++ }${ SUB_SEPARATOR }List`;
	}

	/** @override */
	toString(): string {
		return this.name.concat(...this.suffixes.flatMap((s) => [PARAM_SEPARATOR, s.source]));
	}

	hasSuffix(p: ASTNodeParam | ASTNodeArg | ASTNodeCondition): boolean {
		return !!this.suffixes.find((suffix) => suffix.source === p.source);
	}
}
