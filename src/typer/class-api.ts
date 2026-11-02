import * as TYPE from './type/index.ts';
import {IntrinsicName} from '../parser/index.ts';



/** Schema for generic arguments provided in a class call, generic function call, or type function call. */
type GenericArgs = {
	readonly positional: readonly TYPE.Type[],
	readonly named:      ReadonlyMap<bigint, TYPE.Type[]>,
};



/**
 * Schema for a single generic parameter of a class.
 * Currently used as a precursor to an `AST.ParameterGeneric` node, until we fully implement generics.
 * @property name             - Is the parameter named? If true, this schema must not have a `positional` property.
 * @property readonlyVariance - The variance when the object is read-only.
 * @property mutableVariance  - The variance when the object is mutable.
 * @property constraint       - The type, if any, that the parameter is required to narrow or widen.
 * @property default          - The default value of the parameter, which is an optional parameter.
 */
type GenericParameter = {
	readonly readonlyVariance?: 'bivariant' | 'covariant' | 'contravariant' | 'invariant', // defaults to 'invariant'
	readonly mutableVariance?:  'bivariant' | 'covariant' | 'contravariant' | 'invariant', // defaults to the value of `readonlyVariance` if given, else 'invariant'
	readonly constraint?:       readonly ['narrows' | 'widens', TYPE.Type],
	readonly default?:          TYPE.Type,
};



/** Schema defining a class’s generic parameters. */
type GenericParams = {
	readonly positional?: readonly GenericParameter[],
	readonly named?:      ReadonlyMap<bigint, GenericParameter>,
};



/**
 * Schema for defining the parameters of a single constructor overload.
 * Takes generic parameters Effectively a function type, but without the return.
 */
type ConstructorOverload = {
	readonly positional?: TYPE.Tuple,
	readonly named?:      TYPE.Record,
};



/**
 * Schema for defining a class’s constructor signatures.
 * @property genericParams - generic parameters for the class
 * @property overloads     - a list of class constructor overload signatures
 * @property returnType    - the return type of the constructor call, or type of the type call (they’re the same)
 */
export type ClassSignature = {
	readonly genericParams?: GenericParams,
	readonly overloads?:     (generic_params: GenericArgs) => readonly ConstructorOverload[],
	readonly returnType:     (generic_params: GenericArgs) => TYPE.Type,
};



const VARIANCE = {
	'1':       {readonlyVariance: 'invariant',     mutableVariance: 'invariant'},
	'in':      {readonlyVariance: 'contravariant', mutableVariance: 'contravariant'},
	'out':     {readonlyVariance: 'covariant',     mutableVariance: 'covariant'},
	'in(out)': {readonlyVariance: 'contravariant', mutableVariance: 'invariant'},
	'out(in)': {readonlyVariance: 'covariant',     mutableVariance: 'invariant'},
	'(inout)': {readonlyVariance: 'bivariant',     mutableVariance: 'invariant'},
	'(in)':    {readonlyVariance: 'bivariant',     mutableVariance: 'contravariant'},
	'(out)':   {readonlyVariance: 'bivariant',     mutableVariance: 'covariant'},
	'0':       {readonlyVariance: 'bivariant',     mutableVariance: 'bivariant'},
} as const;



/**
 * API for all intrinsic classes.
 */
export const CLASS_API = new Map<IntrinsicName, ClassSignature>([
	/*
	 * ```cpl
	 * declare class Null {}
	 * ```
	 */
	[IntrinsicName.NULL, {returnType: () => TYPE.NULL}],

	/*
	 * ```cpl
	 * declare class Boolean {
	 * 	new (?: anything);
	 * }
	 * ```
	 */
	[IntrinsicName.BOOLEAN, {
		overloads:  () => [{positional: new TYPE.Tuple([{type: TYPE.ANYTHING, optional: true}])}],
		returnType: () => TYPE.BOOL,
	}],

	/*
	 * ```cpl
	 * declare class Symbol {}
	 * ```
	 */
	[IntrinsicName.SYMBOL, {returnType: () => TYPE.SYM}],

	/*
	 * ```cpl
	 * declare class Integer {
	 * 	new (?: int | nat | float);
	 * }
	 * ```
	 */
	[IntrinsicName.INTEGER, {
		overloads:  () => [{positional: new TYPE.Tuple([{type: TYPE.NUMBER, optional: true}])}],
		returnType: () => TYPE.INT,
	}],

	/*
	 * ```cpl
	 * declare class Natural {
	 * 	new (?: int | nat | float);
	 * }
	 * ```
	 */
	[IntrinsicName.NATURAL, {
		overloads:  () => [{positional: new TYPE.Tuple([{type: TYPE.NUMBER, optional: true}])}],
		returnType: () => TYPE.NAT,
	}],

	/*
	 * ```cpl
	 * declare class Float {
	 * 	new (?: int | nat | float);
	 * }
	 * ```
	 */
	[IntrinsicName.FLOAT, {
		overloads:  () => [{positional: new TYPE.Tuple([{type: TYPE.NUMBER, optional: true}])}],
		returnType: () => TYPE.FLOAT,
	}],

	/*
	 * ```cpl
	 * declare class String {
	 * 	new (?: anything);
	 * }
	 * ```
	 */
	[IntrinsicName.STRING, {
		overloads:  () => [{positional: new TYPE.Tuple([{type: TYPE.ANYTHING, optional: true}])}],
		returnType: () => TYPE.STR,
	}],

	/*
	 * ```cpl
	 * declare class open Object {}
	 * ```
	 */
	[IntrinsicName.OBJECT, {returnType: () => TYPE.OBJ}],

	/*
	 * ```cpl
	 * declare class List[out(in) T] extends Object {
	 * 	new ();
	 * 	new (());
	 * 	new ((T,));
	 * 	new ((T, T));
	 * 	new (anything); % any tuple type with items of type `T`
	 * 	new (List[T]);
	 * 	new (Set[T]);
	 * }
	 * ```
	 */
	[IntrinsicName.LIST, {
		genericParams: {positional: [VARIANCE['out(in)']]},
		overloads:     ({positional: [t]}) => [
			{},
			{positional: TYPE.Tuple.fromTypes([new TYPE.List(t)])},
			{positional: TYPE.Tuple.fromTypes([new TYPE.Set(t)])},
		],
		returnType: ({positional: [t]}) => new TYPE.List(t, true),
	}],

	/*
	 * ```cpl
	 * declare class Dict[out(in) T] extends Object {
	 * 	new ();
	 * 	new (());
	 * 	new (((sym, T),));
	 * 	new (((sym, T), (sym, T)));
	 * 	new (anything); % any tuple type with items of type `(sym, T)`
	 * 	new ((a: T));
	 * 	new ((a: T, b: T));
	 * 	new (anything); % any record type with values of type `T`
	 * 	new (List[(sym, T)]);
	 * 	new (Dict[T]);
	 * 	new (Set[(sym, T)]);
	 * 	new (Map[sym, T]);
	 * }
	 * ```
	 */
	[IntrinsicName.DICT, {
		genericParams: {positional: [VARIANCE['out(in)']]},
		overloads:     ({positional: [t]}) => [
			{},
			{positional: TYPE.Tuple.fromTypes([new TYPE.List(TYPE.Tuple.fromTypes([TYPE.SYM, t]))])},
			{positional: TYPE.Tuple.fromTypes([new TYPE.Dict(t)])},
			{positional: TYPE.Tuple.fromTypes([new TYPE.Set(TYPE.Tuple.fromTypes([TYPE.SYM, t]))])},
			{positional: TYPE.Tuple.fromTypes([new TYPE.Map(TYPE.SYM, t)])},
		],
		returnType: ({positional: [t]}) => new TYPE.Dict(t, true),
	}],

	/*
	 * ```cpl
	 * declare class Set[out(in) T] extends Object {
	 * 	new ();
	 * 	new (());
	 * 	new ((T,));
	 * 	new ((T, T));
	 * 	new (anything); % any tuple type with items of type `T`
	 * 	new (List[T]);
	 * 	new (Set[T]);
	 * }
	 * ```
	 */
	[IntrinsicName.SET, {
		genericParams: {positional: [VARIANCE['out(in)']]},
		overloads:     ({positional: [t]}) => [
			{},
			{positional: TYPE.Tuple.fromTypes([new TYPE.List(t)])},
			{positional: TYPE.Tuple.fromTypes([new TYPE.Set(t)])},
		],
		returnType: ({positional: [t]}) => new TYPE.Set(t, true),
	}],

	/*
	 * ```cpl
	 * declare class Map[out(in) K, out(in) V] extends Object {
	 * 	new ();
	 * 	new (());
	 * 	new (((K, V),));
	 * 	new (((K, V), (K, V)));
	 * 	new (anything); % any tuple type with items of type `(K, V)`
	 * 	new (List[(K, V)]);
	 * 	new (Set[(K, V)]);
	 * 	new (Map[K, V]);
	 * }
	 * ```
	 */
	[IntrinsicName.MAP, {
		genericParams: {
			positional: [
				VARIANCE['out(in)'],
				VARIANCE['out(in)'],
			],
		},
		overloads: ({positional: [k, v]}) => [
			{},
			{positional: TYPE.Tuple.fromTypes([new TYPE.List (TYPE.Tuple.fromTypes([k, v]))])},
			{positional: TYPE.Tuple.fromTypes([new TYPE.Set  (TYPE.Tuple.fromTypes([k, v]))])},
			{positional: TYPE.Tuple.fromTypes([new TYPE.Map  (k, v)])},
		],
		returnType: ({positional: [k, v]}) => new TYPE.Map(k, v, true),
	}],

	/*
	 * ```cpl
	 * declare class open Exception extends Object {
	 * 	new (str, ?: Exception);
	 * }
	 * ```
	 */
	[IntrinsicName.EXCEPTION, {
		overloads:  () => [{positional: new TYPE.Tuple([{type: TYPE.STR, optional: false}, {type: TYPE.EXCP, optional: true}])}],
		returnType: () => TYPE.EXCP,
	}],

	/*
	 * ```cpl
	 * declare class abstract Maybe[out T] extends Object {}
	 * declare class None[out T] extends Maybe[T] {
	 * 	new ();
	 * }
	 * declare class Some[out T] extends Maybe[T] {
	 * 	new (T);
	 * }
	 * ```
	 */
	[IntrinsicName.MAYBE, {
		genericParams: {positional: [VARIANCE.out]},
		returnType:    ({positional: [t]}) => new TYPE.Maybe(t),
	}],
	[IntrinsicName.NONE, {
		genericParams: {positional: [VARIANCE.out]},
		overloads:     () => [{}],
		returnType:    ({positional: [t]}) => new TYPE.None(t),
	}],
	[IntrinsicName.SOME, {
		genericParams: {positional: [VARIANCE.out]},
		overloads:     ({positional: [t]}) => [{positional: TYPE.Tuple.fromTypes([t])}],
		returnType:    ({positional: [t]}) => new TYPE.Some(t),
	}],

	/*
	 * ```cpl
	 * declare class abstract Result[out T, out E? narrows Exception = Exception] extends Object {}
	 * declare class Fail[out T, out E? narrows Exception = Exception] extends Result[T, E] {
	 * 	new (E);
	 * }
	 * declare class Ok[out T, out E? narrows Exception = Exception] extends Result[T, E] {
	 * 	new (T);
	 * }
	 * ```
	 */
	[IntrinsicName.RESULT, {
		genericParams: {positional: [VARIANCE.out, {...VARIANCE.out, constraint: ['narrows', TYPE.EXCP], default: TYPE.EXCP}]},
		returnType:    ({positional: [t, e]}) => new TYPE.Result(t, e),
	}],
	[IntrinsicName.FAIL, {
		genericParams: {positional: [VARIANCE.out, {...VARIANCE.out, constraint: ['narrows', TYPE.EXCP], default: TYPE.EXCP}]},
		overloads:     ({positional: [_, e]}) => [{positional: TYPE.Tuple.fromTypes([e])}],
		returnType:    ({positional: [t, e]}) => new TYPE.Fail(t, e),
	}],
	[IntrinsicName.OK, {
		genericParams: {positional: [VARIANCE.out, {...VARIANCE.out, constraint: ['narrows', TYPE.EXCP], default: TYPE.EXCP}]},
		overloads:     ({positional: [t]})    => [{positional: TYPE.Tuple.fromTypes([t])}],
		returnType:    ({positional: [t, e]}) => new TYPE.Ok(t, e),
	}],

	/*
	 * ```cpl
	 * declare class abstract Function extends Object {}
	 * ```
	 */
	[IntrinsicName.FUNCTION, {returnType: () => TYPE.FUNCTION}],

	/*
	 * ```cpl
	 * declare class open Class {}
	 * ```
	 */
	[IntrinsicName.CLASS, {returnType: () => TYPE.CLASS}],
]);
