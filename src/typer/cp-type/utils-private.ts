import {Keyword} from '../../parser/index.ts';
import type {Type} from './index.ts';



export type ReadonlyArrayOfAtLeast2<T> = readonly [T, T, ...readonly T[]];



/**
 * Comparator function for checking “sameness” of `Type` set elements.
 * Types should be “the same” iff they are equal per the Counterpoint specification.
 */
export const language_types_equal = (a: Type, b: Type): boolean => a.equals(b);



export const MUT_OPERATOR = `${ Keyword.MUTABLE } `;
