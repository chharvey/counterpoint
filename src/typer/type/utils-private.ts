import type {Type} from './index.ts';



export enum Variance {
	INVARIANT,
	COVARIANT,
	CONTRAVARIANT,
	BIVARIANT,
}



export type ArrayOfAtLeast2<T> = [T, T, ...T[]];



/**
 * Internal representation of a generic parameter of a Counterpoint class or function.
 */
export type GenericParameter = {
	/** The name of the parameter as written in source. */
	readonly name:     string,
	/** Whether the parmeter is declared with a narrowing restriction. */
	readonly narrows?: Type,
	/** Whether the parmeter is declared with a widening restriction. */
	readonly widens?:  Type,
	/** The parmeter’s variance in contexts. */
	readonly variance: {
		readonly normally:    Variance,
		readonly whenMutable: Variance,
	},
	/** The type argument assigned to the parameter. */
	readonly assigned: Type,
};
