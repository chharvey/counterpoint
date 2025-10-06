import {Keyword} from '../../parser/index.ts';
import type {Type} from './index.ts';



export enum Variance {
	INVARIANT,
	COVARIANT,
	CONTRAVARIANT,
	BIVARIANT,
}



export type ReadonlyArrayOfAtLeast2<T> = readonly [T, T, ...readonly T[]];



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



/**
 * Comparator function for checking “sameness” of `Type` set elements.
 * Types should be “the same” iff they are equal per the Counterpoint specification.
 */
export const language_types_equal = (a: Type, b: Type): boolean => a.equals(b);



export const MUT_OPERATOR = `${ Keyword.MUTABLE } `;
