import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	AssignmentErrorDuplicateKey,
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
	type ValidTypeAccessOperator,
	type ValidAccessOperator,
	Validator,
} from '../index.ts';
import {
	Index,
	Key,
	type ParameterFunction,
	type TYPE as AST_TYPE,
	EXPR,
} from './index.ts';



function throwWrongSubtypeError(accessor: EXPR.Expression, supertype: TYPE.Type): never {
	throw new TypeErrorNotNarrow(accessor.type(), supertype, accessor.line_index, accessor.col_index);
}



function only_errors_of_type<E extends Error = Error>(err: unknown, types: readonly ConstructorType<E>[]): boolean {
	return (
		types.some((typ) => err instanceof typ) ||
		err instanceof AggregateError && err.errors.every((suberr) => only_errors_of_type<E>(suberr, types))
	);
}



/** Ensure no duplicate keys in a record/dict expression/type or function type. */
export function check_unique_keys(keys: readonly Key[]): void {
	return xjs.Array.forEachAggregated(keys, (key, i) => {
		key.varCheck();
		if (keys.slice(0, i).find((k) => k.id === key.id)) {
			throw new AssignmentErrorDuplicateKey(key);
		}
	});
}

/** Ensure no duplicate parameter keys in a function expression/declaration. */
export function check_unique_param_keys(params: readonly ParameterFunction[]): void {
	const key_ids: bigint[] = [];
	return xjs.Array.forEachAggregated(params, (param, i) => {
		const key_id: bigint | undefined = param.labelId;
		if (key_id !== undefined) {
			if (key_ids.slice(0, i).includes(key_id)) {
				throw new AssignmentErrorDuplicateKey(param.key ?? param.identifier!);
			} else {
				key_ids.push(key_id);
			}
		}
	});
}



export enum ValidIntrinsicName {
	OBJECT = 'Object',
}

export enum ValidFunctionName {
	INTEGER = 'Integer',
	NATURAL = 'Natural',
	FLOAT   = 'Float',
	STRING  = 'String',
	LIST    = 'List',
	DICT    = 'Dict',
	SET     = 'Set',
	MAP     = 'Map',
}

export type ValidGenericFunctionName = (
	| ValidFunctionName.LIST
	| ValidFunctionName.DICT
	| ValidFunctionName.SET
	| ValidFunctionName.MAP
);

const FUNCTION_NAMES: readonly string[] = Object.values(ValidFunctionName);

export const GENERIC_FUNCTION_NAMES: readonly string[] = [
	ValidFunctionName.LIST,
	ValidFunctionName.DICT,
	ValidFunctionName.SET,
	ValidFunctionName.MAP,
];

export function is_valid_intrinsic_name(source: string): source is ValidIntrinsicName {
	return Object.values<string>(ValidIntrinsicName).includes(source);
}

export function check_valid_function_name(source: string): asserts source is ValidFunctionName {
	if (!FUNCTION_NAMES.includes(source)) {
		throw new SyntaxError(`Unexpected token: \`${ source }\`; expected \`${ FUNCTION_NAMES.join(' | ') }\`.`);
	}
}

export function check_valid_generic_function_name(source: string): asserts source is ValidGenericFunctionName {
	if (!GENERIC_FUNCTION_NAMES.includes(source)) {
		throw new SyntaxError(`Unexpected token: \`${ source }\`; expected \`${ GENERIC_FUNCTION_NAMES.join(' | ') }\`.`);
	}
}



type GenericArgsSpec = readonly TYPE.Type[]; // TODO: intersect with `Readonly<Record<string, TYPE.Type>>` once we have named arguments

/**
 * A schema for a generic parameter.
 * @property positional    - Is the parameter positional (as opposed to named)? If true, this schema must not have a `name` property.
 * @property name          - Is the parameter named? If true, this schema must not have a `positional` property.
 * @property covariant     - The manner in which the parameter is covariant (in the `out` position).
 * @property contravariant - The manner in which the parameter is contravariant (in the `in` position).
 * @property constraint    - The type, if any, that the parameter is required to narrow or widen.
 * @property default       - The default value of the parameter, which is an optional parameter.
 */
type GenericParameterSchema = (
	& ({readonly positional: true}) // TODO: union with `{readonly name: string}` once we have named arguments
	& {
		readonly covariant?:     'never' | 'always' | 'when_mutable',
		readonly contravariant?: 'never' | 'always' | 'when_mutable',
		readonly constraint?:    {readonly direction: 'narrows' | 'widens', readonly type: (generic_params: GenericArgsSpec) => TYPE.Type},
		readonly default?:       (generic_params: GenericArgsSpec) => TYPE.Type,
	}
);

/**
 * A schema for a functional parameter.
 * @property positional - Is the parameter positional (as opposed to named)? If true, this schema must not have a `name` property.
 * @property name       - Is the parameter named? If true, this schema must not have a `positional` property.
 * @property type       - The required type of the parameter.
 * @property optional   - Is the parameter optional? If true, it may or may not have a default value.
 * @property default    - The default value of the parameter. If present, this schema’s `optional` property must be `true`.
 */
type FunctionParameterSchema = (
	& ({readonly positional: true}) // TODO: union with `{readonly name: string}` once we have named arguments
	& {readonly type: (generic_params: GenericArgsSpec) => TYPE.Type}
	& ({readonly optional?: false} | {readonly optional: true, readonly default?: unknown})
);

/**
 * A schema for a constructor type call or constructor call.
 * @property genericParams - an array of generic parameters for the class
 * @property overloads     - a list of class constructor overload signatures
 * @property returnType    - the return type of the constructor call, or type of the type call (they’re the same)
 */
export type ConstructorSchema = {
	readonly genericParams: readonly GenericParameterSchema[],
	readonly overloads:     readonly (readonly FunctionParameterSchema[])[],
	readonly returnType:    (generic_params: GenericArgsSpec) => TYPE.Type,
};

/**
 * ```cpl
 * declare class data Integer {
 * 	new (x: int | nat | float);
 * }
 * declare class data Natural {
 * 	new (x: int | nat | float);
 * }
 * declare class data Float {
 * 	new (x: int | nat | float);
 * }
 * declare class data String {
 * 	new (x: anything);
 * }
 * declare class List<T> {
 * 	new ();
 * 	new (tup0:  ());
 * 	new (tup1:  (T,));
 * 	new (tup2:  (T, T));
 * 	new (tup:   anything); % any tuple type with items of type `T`
 * 	new (list:  List.<T>);
 * 	new ('set': Set.<T>);
 * }
 * declare class Dict<T> {
 * 	new ();
 * 	new (tup0:  ());
 * 	new (tup1:  ((sym, T),));
 * 	new (tup2:  ((sym, T), (sym, T)));
 * 	new (tup:   anything); % any tuple type with items of type `(sym, T)`
 * 	new (recA:  (a: T));
 * 	new (recAB: (a: T, b: T));
 * 	new (rec:   anything); % any record type with values of type `T`
 * 	new (list:  List.<(sym, T)>);
 * 	new (dict:  Dict.<T>);
 * 	new ('set': Set.<(sym, T)>);
 * 	new (map:   Map.<sym, T>);
 * }
 * declare class Set<T> {
 * 	new ();
 * 	new (tup0:  ());
 * 	new (tup1:  (T,));
 * 	new (tup2:  (T, T));
 * 	new (tup:   anything); % any tuple type with items of type `T`
 * 	new (list:  List.<T>);
 * 	new ('set': Set.<T>);
 * }
 * declare class Map<K, V> {
 * 	new ();
 * 	new (tup0:  ());
 * 	new (tup1:  ((K, V),));
 * 	new (tup2:  ((K, V), (K, V)));
 * 	new (tup:   anything); % any tuple type with items of type `(K, V)`
 * 	new (list:  List.<(K, V)>);
 * 	new ('set': Set.<(K, V)>);
 * 	new (map:   Map.<K, V>);
 * }
 * ```
 */
export const CLASS_API = new Map<ValidFunctionName, ConstructorSchema>([
	[ValidFunctionName.INTEGER, {
		genericParams: [],
		overloads:     [[{positional: true, type: () => TYPE.NUMBER}]],
		returnType:    () => TYPE.INT,
	}],
	[ValidFunctionName.NATURAL, {
		genericParams: [],
		overloads:     [[{positional: true, type: () => TYPE.NUMBER}]],
		returnType:    () => TYPE.NAT,
	}],
	[ValidFunctionName.FLOAT, {
		genericParams: [],
		overloads:     [[{positional: true, type: () => TYPE.NUMBER}]],
		returnType:    () => TYPE.FLOAT,
	}],
	[ValidFunctionName.STRING, {
		genericParams: [],
		overloads:     [[{positional: true, type: () => TYPE.ANYTHING}]],
		returnType:    () => TYPE.STR,
	}],
	[ValidFunctionName.LIST, {
		genericParams: [{positional: true}],
		overloads:     [
			[],
			[{positional: true, type: (generic_params) => new TYPE.List(generic_params[0])}],
			[{positional: true, type: (generic_params) => new TYPE.Set (generic_params[0])}],
		],
		returnType: (generic_params) => new TYPE.List(generic_params[0]),
	}],
	[ValidFunctionName.DICT, {
		genericParams: [{positional: true}],
		overloads:     [
			[],
			[{positional: true, type: (generic_params) => new TYPE.List(TYPE.Tuple.fromTypes([TYPE.SYM, generic_params[0]]))}],
			[{positional: true, type: (generic_params) => new TYPE.Dict(generic_params[0])}],
			[{positional: true, type: (generic_params) => new TYPE.Set(TYPE.Tuple.fromTypes([TYPE.SYM, generic_params[0]]))}],
			[{positional: true, type: (generic_params) => new TYPE.Map(TYPE.SYM, generic_params[0])}],
		],
		returnType: (generic_params) => new TYPE.Dict(generic_params[0]),
	}],
	[ValidFunctionName.SET, {
		genericParams: [{positional: true}],
		overloads:     [
			[],
			[{positional: true, type: (generic_params) => new TYPE.List(generic_params[0])}],
			[{positional: true, type: (generic_params) => new TYPE.Set (generic_params[0])}],
		],
		returnType: (generic_params) => new TYPE.Set(generic_params[0]),
	}],
	[ValidFunctionName.MAP, {
		genericParams: [{positional: true}, {positional: true, default: (generic_params) => generic_params[0]}],
		overloads:     [
			[],
			[{positional: true, type: (generic_params) => new TYPE.List(TYPE.Tuple.fromTypes([generic_params[0], generic_params[1]]))}],
			[{positional: true, type: (generic_params) => new TYPE.Set (TYPE.Tuple.fromTypes([generic_params[0], generic_params[1]]))}],
			[{positional: true, type: (generic_params) => new TYPE.Map(generic_params[0], generic_params[1])}],
		],
		returnType: (generic_params) => new TYPE.Map(generic_params[0], generic_params[1]),
	}],
]);



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
	const accessor_maybe: boolean = access.kind === Operator.DOT_MAYBE;
	if (base_type.isBottomType) {
		return {type: TYPE.NOTHING, optional: accessor_maybe};
	}
	if (base_type instanceof TYPE.Maybe && accessor_maybe) {
		const info: EntryType = get_entry_info(base_type.typearg, access, is_writing);
		return {...info, type: new TYPE.Maybe(info.type)};
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
				if (only_errors_of_type(error, [TypeErrorNoEntry, TypeErrorNotNarrow])) {
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
				assert.fail(`Expected ${ base_type } to be an intersection or union.`);
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
			const accessor_type: TYPE.Type = access.accessor.type();
			if (accessor_type.isBottomType) {
				return {type: TYPE.NOTHING, optional: accessor_maybe};
			}
			switch (true) {
				case base_type instanceof TYPE.List: {
					const INTEGRAL: TYPE.Type = TYPE.INT.union(TYPE.NAT);
					return accessor_type.isSubtypeOf(INTEGRAL)
						? {type: base_type.typearg, optional: accessor_maybe}
						: throwWrongSubtypeError(access.accessor, INTEGRAL);
				}
				case base_type instanceof TYPE.Dict: {
					return accessor_type.isSubtypeOf(TYPE.SYM)
						? {type: base_type.typearg, optional: accessor_maybe}
						: accessor_type.isSubtypeOf(TYPE.STR)
							? assert.fail(new Error('String keys for dict access are not yet supported.'))
							: throwWrongSubtypeError(access.accessor, TYPE.Union.all(TYPE.SYM, TYPE.STR));
				}
				case base_type instanceof TYPE.Set: {
					return accessor_type.isSubtypeOf(base_type.typearg) || !is_writing
						? {type: TYPE.BOOL, optional: false}
						: throwWrongSubtypeError(access.accessor, base_type.typearg);
				}
				case base_type instanceof TYPE.Map: {
					return accessor_type.isSubtypeOf(base_type.typearg_ant) || !is_writing
						? {type: base_type.typearg_con, optional: accessor_maybe}
						: throwWrongSubtypeError(access.accessor, base_type.typearg_ant);
				}
				default: {
					throw new TypeErrorInvalidOperation(access);
				}
			}
		}
	}
}



export function access_type(
	access_kind: ValidTypeAccessOperator | ValidAccessOperator,
	base_type:   TYPE.Type,
	entry:       EntryType,
	access:      AST_TYPE.Access | EXPR.Access,
): TYPE.Type {
	if (
		access_kind === Operator.DOT     && entry.optional ||
		access_kind === Operator.DOT_MAYBE && !entry.optional && !(base_type instanceof TYPE.Maybe)
	) {
		throw new TypeErrorInvalidOperation(access);
	}
	if (access_kind === Operator.DOT_RESULT) {
		throw new Error('Operator `!.` not yet supported.');
	}
	return entry.optional ? new TYPE.Maybe(entry.type) : entry.type;
}
