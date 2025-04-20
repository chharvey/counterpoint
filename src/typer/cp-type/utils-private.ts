import {TypeErrorInvalidOperation} from '../../index.ts';
import {Keyword} from '../../parser/index.ts';
import {
	Operator,
	type ValidTypeAccessOperator,
	type ValidAccessOperator,
	type AST,
} from '../../validator/index.ts';
import type {TypeEntry} from '../utils-public.ts';
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



export function updateAccessedStaticType(entry: TypeEntry, access_kind: ValidTypeAccessOperator | ValidAccessOperator, is_nullish: boolean, access: AST.ASTNodeTypeAccess | AST.ASTNodeAccess): Type {
	switch (true) {
		case access_kind === Operator.DOT && !entry.optional: {
			return entry.type;
		}
		case access_kind === Operator.OPTDOT && (entry.optional || is_nullish): {
			return entry.type.union(NULL);
		}
		case access_kind === Operator.CLAIMDOT: {
			return entry.type.subtract(VOID);
		}
		default: {
			throw new TypeErrorInvalidOperation(access);
		}
	}
}

export const MUT_OPERATOR = `${ Keyword.MUTABLE } `;
