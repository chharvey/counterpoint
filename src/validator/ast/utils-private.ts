import * as assert from 'node:assert';
import {
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNoEntry,
} from '../../index.ts';
import {
	type ConstructorType,
	assert_instanceof,
} from '../../lib/index.ts';
import {
	type EntryType,
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import {
	Operator,
	Validator,
} from '../index.ts';
import {
	Index,
	Key,
	type TYPE as AST_TYPE,
	EXPR,
	ExprVisitorType,
} from './index.ts';



function throwWrongSubtypeError(subtype: TYPE.Type, supertype: TYPE.Type, accessor: EXPR.Expression): never {
	throw new TypeErrorNotNarrow(subtype, supertype, accessor.line_index, accessor.col_index);
}



export function only_errors_of_type<E extends Error = Error>(err: Error, types: readonly ConstructorType<E>[]): boolean {
	return (
		types.some((typ) => err instanceof typ) ||
		err instanceof AggregateError && err.errors.every((suberr) => only_errors_of_type<E>(suberr, types))
	);
}



export function valueOfTokenNumber(source: string): VALUE.Integer | VALUE.Natural | VALUE.Float {
	const {type: typ, value: cooked} = Validator.cookTokenNumber(source);
	switch (typ) {
		case 'int':   return new VALUE.Integer(cooked);
		case 'nat':   return new VALUE.Natural(cooked);
		case 'float': return new VALUE.Float(cooked);
	}
}



function decombine(t: TYPE.Type): TYPE.Type[] {
	return t instanceof TYPE.Combinable ? t.operands.flatMap((comp) => decombine(comp)) : [t];
}

export function get_entry_info(base_type: TYPE.Type, access: AST_TYPE.Access | EXPR.Access, is_writing: boolean = false): EntryType {
	const accessor_maybe: boolean = access instanceof EXPR.Access && access.kind === Operator.DOT_MAYBE;
	if (base_type.isBottomType) {
		return {type: TYPE.NOTHING, optional: accessor_maybe};
	}
	if (base_type instanceof TYPE.Combinable) {
		const constituents: readonly TYPE.Type[] = decombine(base_type);
		constituents.slice(0, -1).forEach((comp, i) => {
			if (comp.constructor !== constituents[i + 1].constructor) {
				throw new TypeErrorInvalidOperation(access);
			}
		});
		const entry_infos: readonly (EntryType | TypeErrorNoEntry | TypeErrorNotNarrow)[] = base_type.operands.map((comp) => {
			try {
				return get_entry_info(comp, access, is_writing);
			} catch (error) {
				if (only_errors_of_type(error as Error, [TypeErrorNoEntry, TypeErrorNotNarrow])) {
					return error as TypeErrorNoEntry | TypeErrorNotNarrow;
				}
				throw error;
			}
		});
		const errors:  readonly Error[]     = entry_infos.filter((info)                    =>   info instanceof TypeErrorNoEntry || info instanceof TypeErrorNotNarrow);
		const entries: readonly EntryType[] = entry_infos.filter((info): info is EntryType => !(info instanceof TypeErrorNoEntry || info instanceof TypeErrorNotNarrow));
		switch (true) {
			case base_type instanceof TYPE.Intersection: {
				/* Throw an error if *all* of the intersection constituents do not have the accessed entry. */
				if (!entries.length) {
					throw errors.length === 1 ? errors[0] : new AggregateError(errors, errors.map((err) => err.message).join('\n'));
				}
				/*
				 * For intersections:
				 * The accessed entry’s type is the intersection of the constituents’ corresponding entry on any types, and
				 * the accessed entry’s optionality is the conjunction of the constituents’ corresponding optionalities.
				 * (In other words, they must *all* be optional/missing for maybe access to be valid.)
				 */
				return {
					type:     TYPE.Intersection.all(...entries.map((entry) => entry.type)),
					optional: entries.every((entry) => entry.optional),
				};
			}
			case base_type instanceof TYPE.Union: {
				/* Throw an error if *any* of the union constituents do not have the accessed entry. */
				if (errors.length) {
					throw errors.length === 1 ? errors[0] : new AggregateError(errors, errors.map((err) => err.message).join('\n'));
				}
				/*
				 * For unions:
				 * The accessed entry’s type is the union of the constituents’ corresponding entry on any types, and
				 * the accessed entry’s optionality is the disjunction of the constituents’ corresponding optionalities.
				 * (In other words, *any* of them may be optional/missing for maybe access to be valid.)
				 */
				return {
					type:     TYPE.Union.all(...entries.map((entry) => entry.type)),
					optional: entries.some((entry) => entry.optional),
				};
			}
			default: {
				assert.fail(`Expected ${base_type} to be an intersection or union.`);
			}
		}
	}
	switch (true) {
		case access.accessor instanceof Index: {
			if (base_type instanceof TYPE.Tuple) {
				return base_type.get(access.accessor.index, access.accessor);
			} else {
				throw new TypeErrorNoEntry('index', base_type, access.accessor);
			}
		}
		case access.accessor instanceof Key: {
			if (base_type instanceof TYPE.Record) {
				return base_type.get(access.accessor.id, access.accessor);
			} else {
				throw new TypeErrorNoEntry('key', base_type, access.accessor);
			}
		}
		default: {
			assert_instanceof(access, EXPR.Access);
			assert_instanceof(access.accessor, EXPR.Expression);
			const accessor_type: TYPE.Type = new ExprVisitorType().throwIfVoid(access.accessor, new TypeErrorInvalidOperation(access));
			if (accessor_type.isBottomType) {
				return {type: TYPE.NOTHING, optional: accessor_maybe};
			}
			switch (true) {
				case base_type instanceof TYPE.List: {
					const INTEGRAL: TYPE.Type = TYPE.INT.union(TYPE.NAT);
					return accessor_type.isSubtypeOf(INTEGRAL)
						? {type: base_type.typearg, optional: accessor_maybe}
						: throwWrongSubtypeError(accessor_type, INTEGRAL, access.accessor);
				}
				case base_type instanceof TYPE.Dict: {
					return accessor_type.isSubtypeOf(TYPE.SYM)
						? {type: base_type.typearg, optional: accessor_maybe}
						: accessor_type.isSubtypeOf(TYPE.STR)
							? assert.fail(new Error('String keys for dict access are not yet supported.'))
							: throwWrongSubtypeError(accessor_type, TYPE.Union.all(TYPE.SYM, TYPE.STR), access.accessor);
				}
				case base_type instanceof TYPE.Set: {
					return accessor_type.isSubtypeOf(base_type.typearg) || !is_writing
						? {type: TYPE.BOOL, optional: false}
						: throwWrongSubtypeError(accessor_type, base_type.typearg, access.accessor);
				}
				case base_type instanceof TYPE.Map: {
					return accessor_type.isSubtypeOf(base_type.typearg_ant) || !is_writing
						? {type: base_type.typearg_con, optional: accessor_maybe}
						: throwWrongSubtypeError(accessor_type, base_type.typearg_ant, access.accessor);
				}
				default: {
					throw new TypeErrorInvalidOperation(access);
				}
			}
		}
	}
}
