import {Keyword} from '../../parser/index.ts';
import {
	Operator,
	type ValidAccessOperator,
} from '../../validator/index.ts';
import type {EntryType} from '../utils-public.ts';
import {
	type Type,
	VOID,
	NULL,
} from './index.ts';



export type ReadonlyArrayOfAtLeast2<T> = readonly [T, T, ...readonly T[]];



/**
 * Comparator function for checking “sameness” of `Type` set elements.
 * Types should be “the same” iff they are equal per the Counterpoint specification.
 */
export const language_types_equal = (a: Type, b: Type): boolean => a.equals(b);



export function updateAccessedStaticType(entry: EntryType, access_kind: ValidAccessOperator): Type {
	return (access_kind === Operator.CLAIMDOT)
		? entry.type.subtract(VOID)
		: (entry.optional)
			? entry.type.union((access_kind === Operator.OPTDOT) ? NULL : VOID)
			: entry.type;
}

export const MUT_OPERATOR = `${ Keyword.MUTABLE } `;
