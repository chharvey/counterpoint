import * as assert from 'node:assert';
import {
	type EntryType,
	VALUE,
	TYPE,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNoEntry,
} from '../../index.ts';
import type {ConstructorType} from '../../lib/index.ts';
import type {CPConfig} from '../../core/index.ts';
import {
	Operator,
	type ValidTypeAccessOperator,
	type ValidAccessOperator,
	Validator,
	AST,
} from '../index.ts';



function throwWrongSubtypeError(accessor: AST.ASTNodeExpression, supertype: TYPE.Type): never {
	throw new TypeErrorNotNarrow(accessor.type(), supertype, accessor.line_index, accessor.col_index);
}



function only_errors_of_type<E extends Error = Error>(err: unknown, types: readonly ConstructorType<E>[]): boolean {
	return (
		types.some((typ) => err instanceof typ) ||
		err instanceof AggregateError && err.errors.every((suberr) => only_errors_of_type<E>(suberr, types))
	);
}



/**
 * Either a bigint, or a half-closed range of integers from min (inclusive) to max (exclusive).
 * @example
 * const r: ArgCount = [3n, 7n]; % a range of integers including 3, 4, 5, and 6, but not 7.
 * @index 0 the minimum, inclusive
 * @index 1 the maximum, exclusive
 */
export type ArgCount = bigint | readonly [bigint, bigint];



export enum ValidIntrinsicName {
	OBJECT = 'Object',
}

export enum ValidFunctionName {
	LIST = 'List',
	DICT = 'Dict',
	SET  = 'Set',
	MAP  = 'Map',
}

export function is_valid_intrinsic_name(source: string): source is ValidIntrinsicName {
	return Object.values<string>(ValidIntrinsicName).includes(source);
}

export function invalid_function_name(source: string): never {
	throw new SyntaxError(`Unexpected token: ${ source }; expected \`${ Object.values(ValidFunctionName).join(' | ') }\`.`);
}



export function bothNumeric(t0: TYPE.Type, t1: TYPE.Type): boolean;
export function bothNumeric(v0: VALUE.Value, v1: VALUE.Value): boolean;
export function bothNumeric(arg0: TYPE.Type | VALUE.Value, arg1: TYPE.Type | VALUE.Value): boolean {
	const int_float: TYPE.Type = TYPE.INT.union(TYPE.FLOAT);
	return (arg0 instanceof TYPE.Type && arg1 instanceof TYPE.Type)
		? [arg0, arg1].every((t) => t.isSubtypeOf(int_float))
		: [arg0, arg1].every((o) => o instanceof VALUE.Number);
}

export function bothInts(t0: TYPE.Type, t1: TYPE.Type): boolean;
export function bothInts(v0: VALUE.Value, v1: VALUE.Value): boolean;
export function bothInts(arg0: TYPE.Type | VALUE.Value, arg1: TYPE.Type | VALUE.Value): boolean {
	return (arg0 instanceof TYPE.Type && arg1 instanceof TYPE.Type)
		? [arg0, arg1].every((t) => t.isSubtypeOf(TYPE.INT))
		: [arg0, arg1].every((o) => o instanceof VALUE.Integer);
}

export function bothFloats(t0: TYPE.Type, t1: TYPE.Type): boolean;
export function bothFloats(v0: VALUE.Value, v1: VALUE.Value): boolean;
export function bothFloats(arg0: TYPE.Type | VALUE.Value, arg1: TYPE.Type | VALUE.Value): boolean {
	return (arg0 instanceof TYPE.Type && arg1 instanceof TYPE.Type)
		? [arg0, arg1].every((t) => t.isSubtypeOf(TYPE.FLOAT))
		: [arg0, arg1].every((o) => o instanceof VALUE.Float);
}

export function eitherFloats(t0: TYPE.Type, t1: TYPE.Type): boolean;
export function eitherFloats(v0: VALUE.Value, v1: VALUE.Value): boolean;
export function eitherFloats(arg0: TYPE.Type | VALUE.Value, arg1: TYPE.Type | VALUE.Value): boolean {
	return (arg0 instanceof TYPE.Type && arg1 instanceof TYPE.Type)
		? [arg0, arg1].some((t) => t.isSubtypeOf(TYPE.FLOAT))
		: [arg0, arg1].some((o) => o instanceof VALUE.Float);
}

export function neitherFloats(t0: TYPE.Type, t1: TYPE.Type): boolean;
export function neitherFloats(v0: VALUE.Value, v1: VALUE.Value): boolean;
export function neitherFloats(arg0: TYPE.Type | VALUE.Value, arg1: TYPE.Type | VALUE.Value): boolean {
	// @ts-expect-error --- both args are either both `TYPE.Type`s or both `VALUE.Value`s
	return !eitherFloats(arg0, arg1);
}

export function oneFloats(t0: TYPE.Type, t1: TYPE.Type): boolean;
export function oneFloats(v0: VALUE.Value, v1: VALUE.Value): boolean;
export function oneFloats(arg0: TYPE.Type | VALUE.Value, arg1: TYPE.Type | VALUE.Value): boolean {
	// @ts-expect-error --- both args are either both `TYPE.Type`s or both `VALUE.Value`s
	return eitherFloats(arg0, arg1) && !bothFloats(arg0, arg1);
}



export function valueOfTokenNumber(source: string, config: CPConfig): VALUE.Integer | VALUE.Float {
	const cooked: bigint | number = Validator.cookTokenNumber(source, config);
	return (typeof cooked === 'bigint') ? new VALUE.Integer(cooked) : new VALUE.Float(cooked);
}



export function get_entry_info(base_type: TYPE.Type, access: AST.ASTNodeTypeAccess | AST.ASTNodeAccess): EntryType {
	if (base_type.isTopType && access.kind === Operator.DOT_MAY) {
		return {type: TYPE.ANYTHING, optional: true};
	}
	if (base_type instanceof TYPE.Combinable) {
		const entry_infos: readonly (EntryType | TypeErrorNoEntry | TypeErrorNotNarrow)[] = base_type.operands.map((comp) => {
			try {
				return get_entry_info(comp, access);
			} catch (error) {
				if (only_errors_of_type(error, [TypeErrorNoEntry, TypeErrorNotNarrow])) {
					return error as TypeErrorNoEntry | TypeErrorNotNarrow;
				}
				throw error;
			}
		});
		const errors:  readonly Error[]     = entry_infos.filter((info)                    =>   info instanceof TypeErrorNoEntry || info instanceof TypeErrorNotNarrow);
		const entries: readonly EntryType[] = entry_infos.filter((info): info is EntryType => !(info instanceof TypeErrorNoEntry || info instanceof TypeErrorNotNarrow));
		/* Throw an error if *all* of the intersection/union constituents do not have the accessed entry. */
		if (!entries.length) {
			throw errors.length === 1 ? errors[0] : new AggregateError(errors, errors.map((err) => err.message).join('\n'));
		}
		switch (true) {
			case base_type instanceof TYPE.Intersection: {
				/*
				 * For intersections:
				 * The accessed entry’s type is the intersection of the constituents’ corresponding entry on any types, and
				 * the accessed entry’s optionality is the conjunction of the constituents’ corresponding optionalities.
				 * (In other words, they must *all* be optional/missing for maybe access to be valid.)
				 */
				return {
					type:     TYPE.Intersection.all(entries.map((entry) => entry.type)),
					optional: entries.every((entry) => entry.optional),
				};
			}
			case base_type instanceof TYPE.Union: {
				/*
				 * For unions:
				 * The accessed entry’s type is the union of the constituents’ corresponding entry on any types, and
				 * the accessed entry’s optionality is the disjunction of the constituents’ corresponding optionalities.
				 * (In other words, *any* of them may be optional/missing for maybe access to be valid.)
				 * Also: If all of them are not optional, but some are missing (i.e. error(s) were caught), then maybe access is required.
				 */
				return {
					type:     TYPE.Union.all(entries.map((entry) => entry.type)),
					optional: entries.some((entry) => entry.optional) || !!errors.length,
				};
			}
			default: {
				assert.fail(`Expected ${ base_type } to be an intersection or union.`);
			}
		}
	}
	switch (true) {
		case access.accessor instanceof AST.ASTNodeIndex: {
			if (base_type instanceof TYPE.Tuple) {
				return base_type.get(access.accessor.index, access.accessor);
			} else {
				throw new TypeErrorNoEntry('index', base_type, access.accessor);
			}
		}
		case access.accessor instanceof AST.ASTNodeKey: {
			if (base_type instanceof TYPE.Record) {
				return base_type.get(access.accessor.id, access.accessor);
			} else {
				throw new TypeErrorNoEntry('key', base_type, access.accessor);
			}
		}
		default: {
			const accessor_type:  TYPE.Type = access.accessor.type();
			const accessor_maybe: boolean   = access.kind === Operator.DOT_MAY;
			switch (true) {
				case base_type === TYPE.NULL: {
					return {type: TYPE.NULL, optional: true};
				}
				case base_type instanceof TYPE.List: {
					return accessor_type.isSubtypeOf(TYPE.INT)
						? {type: base_type.invariant, optional: accessor_maybe}
						: throwWrongSubtypeError(access.accessor, TYPE.INT);
				}
				case base_type instanceof TYPE.Dict: {
					return accessor_type.isSubtypeOf(TYPE.SYM)
						? {type: base_type.invariant, optional: accessor_maybe}
						: accessor_type.isSubtypeOf(TYPE.STR)
							? assert.fail(new Error('String keys for dict access are not yet supported.'))
							: throwWrongSubtypeError(access.accessor, TYPE.Union.all(TYPE.SYM, TYPE.STR));
				}
				case base_type instanceof TYPE.Set: {
					return accessor_type.isSubtypeOf(base_type.invariant)
						? {type: TYPE.BOOL, optional: false}
						: throwWrongSubtypeError(access.accessor, base_type.invariant);
				}
				case base_type instanceof TYPE.Map: {
					return accessor_type.isSubtypeOf(base_type.invariant_ant)
						? {type: base_type.invariant_con, optional: accessor_maybe}
						: throwWrongSubtypeError(access.accessor, base_type.invariant_ant);
				}
				default: {
					throw new TypeErrorInvalidOperation(access);
				}
			}
		}
	}
}



export function validate_access_kind(access_kind: ValidTypeAccessOperator | ValidAccessOperator, is_entry_optional: boolean, access: AST.ASTNodeTypeAccess | AST.ASTNodeAccess): void {
	if (
		access_kind === Operator.DOT     &&  is_entry_optional ||
		access_kind === Operator.DOT_MAY && !is_entry_optional
	) {
		throw new TypeErrorInvalidOperation(access);
	}
	if (access_kind === Operator.DOT_RES) {
		throw new TypeError('Operator `!.` not yet supported.');
	}
}



export function update_accessed_type(type: TYPE.Type, access_kind: ValidTypeAccessOperator | ValidAccessOperator): TYPE.Type {
	switch (access_kind) {
		case Operator.DOT: {
			return type;
		}
		case Operator.DOT_MAY: {
			return type.union(TYPE.NULL);
		}
		case Operator.DOT_RES: {
			throw new TypeError('Operator `!.` not yet supported.');
		}
	}
}
