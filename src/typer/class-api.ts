import * as VALUE from './value/index.ts';
import * as TYPE from './type/index.ts';
import {CoreLibName} from '../parser/index.ts';



/** Schema for generic arguments provided in a class call, generic function call, or type function call. */
export type GenericArgs = {
	readonly positional: readonly TYPE.Type[],
	readonly named:      ReadonlyMap<bigint, TYPE.Type>,
};



/**
 * Schema for a single generic parameter of a function or class.
 * @property constraint - The type, if any, that the parameter is required to narrow or widen. May reference prior params.
 * @property default    - The default value of the parameter (if and only if it is optional).
 */
type GenericFuncParameter = {
	readonly constraint?: readonly ['narrows' | 'widens', (prior: GenericArgs) => TYPE.Type],
	readonly default?:    (prior: GenericArgs) => TYPE.Type,
};
/**
 * Schema for a single generic parameter of a class.
 * Currently used as a precursor to an `AST.ParameterGeneric` node, until we fully implement generics.
 * @property readonlyVariance - The variance when the object is read-only.
 * @property mutableVariance  - The variance when the object is mutable.
 * @property constraint       - The type, if any, that the parameter is required to narrow or widen.
 * @property default          - The default value of the parameter, which is an optional parameter.
 */
type GenericClassParameter = GenericFuncParameter & {
	readonly readonlyVariance?: 'bivariant' | 'covariant' | 'contravariant' | 'invariant', // defaults to 'invariant'
	readonly mutableVariance?:  'bivariant' | 'covariant' | 'contravariant' | 'invariant', // defaults to the value of `readonlyVariance` if given, else 'invariant'
};



/** Schema defining a functions’s generic parameters. */
export type GenericFuncParams = {
	readonly positional?: readonly GenericFuncParameter[],
	readonly named?:      ReadonlyMap<bigint, GenericFuncParameter>,
};
/** Schema defining a class’s generic parameters. */
type GenericClassParams = {
	readonly positional?: readonly GenericClassParameter[],
	readonly named?:      ReadonlyMap<bigint, GenericClassParameter>,
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
 * Schema for defining a function’s signatures (more than one if it has overloads).
 *
 * An array of pairs, each pair representing an overload:
 * @property genericParams generic parameters for the function overload
 * @property funcType      a native function returning a function type based on the given generic arguments
 */
type FuncSignature = {
	readonly genericParams: GenericFuncParams,
	readonly funcType:      (generic_args: GenericArgs) => TYPE.Function,
};
/**
 * Schema for defining a class’s constructor signatures.
 * @property genericParams generic parameters for the class
 * @property overloads     a list of class constructor overload signatures
 * @property returnType    the return type of the constructor call, or type of the type call (they’re the same)
 * @property instanceType  the root type of all return types.
 * 	if non-generic, `instanceType` amd `returnType` are the same;
 * 	if generic, `instanceType` is the type to which all generic invocations are assignable
 * 	(e.g. `List[anything]` is the supertype of all generic `List[‹T›]` types)
 */
export type ClassSignature = {
	readonly genericParams?: GenericClassParams,
	readonly overloads?:     (generic_args: GenericArgs) => readonly ConstructorOverload[],
	readonly returnType:     (generic_args: GenericArgs) => TYPE.Type,
	readonly instanceType:   TYPE.Type,
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
 * API for all core lib functions.
 * ```cpl
 * claim 'List#get'[T](List[T], int): Maybe[T];
 * claim 'List#set'[T](mut List[T], int, T): void;
 *
 * claim 'Dict#get'[T](Dict[T], sym): Maybe[T];
 * claim 'Dict#set'[T](mut Dict[T], sym, T): void;
 *
 * claim 'Set#has'[T, T1? widens T = anything](Set[T], T1): bool;
 * claim 'Set#put'[T](mut Set[T], T): void;
 * claim 'Set#delete'[T, T1? widens T = anything](mut Set[T], T1): void;
 *
 * claim 'Map#get'[K, V, K1? widens K = anything](Map[K, V], K1): Maybe[V];
 * claim 'Map#set'[K, V](mut Map[K, V], K, V): void;
 * ```
 */
export const FUNC_API = new Map<string, FuncSignature>([
	['\'List#get\'', {
		genericParams: {positional: [{}]},
		funcType:      ({positional: [t]}) => new TYPE.Function(TYPE.Tuple.fromTypes([new TYPE.List(t), TYPE.INT]), undefined, new TYPE.Maybe(t)),
	}],
	['\'List#set\'', {
		genericParams: {positional: [{}]},
		funcType:      ({positional: [t]}) => new TYPE.Function(TYPE.Tuple.fromTypes([new TYPE.List(t, true), TYPE.INT, t])),
	}],
	['\'Dict#get\'', {
		genericParams: {positional: [{}]},
		funcType:      ({positional: [t]}) => new TYPE.Function(TYPE.Tuple.fromTypes([new TYPE.Dict(t), TYPE.SYM]), undefined, new TYPE.Maybe(t)),
	}],
	['\'Dict#set\'', {
		genericParams: {positional: [{}]},
		funcType:      ({positional: [t]}) => new TYPE.Function(TYPE.Tuple.fromTypes([new TYPE.Dict(t, true), TYPE.SYM, t])),
	}],
	['\'Set#has\'', {
		genericParams: {positional: [{}, {constraint: ['widens', ({positional: [t]}) => t], default: () => TYPE.ANYTHING}]},
		funcType:      ({positional: [t, t1]}) => new TYPE.Function(TYPE.Tuple.fromTypes([new TYPE.Set(t), t1]), undefined, TYPE.BOOL),
	}],
	['\'Set#put\'', {
		genericParams: {positional: [{}]},
		funcType:      ({positional: [t]}) => new TYPE.Function(TYPE.Tuple.fromTypes([new TYPE.Set(t, true), t])),
	}],
	['\'Set#delete\'', {
		genericParams: {positional: [{}, {constraint: ['widens', ({positional: [t]}) => t], default: () => TYPE.ANYTHING}]},
		funcType:      ({positional: [t, t1]}) => new TYPE.Function(TYPE.Tuple.fromTypes([new TYPE.Set(t, true), t1])),
	}],
	['\'Map#get\'', {
		genericParams: {positional: [{}, {}, {constraint: ['widens', ({positional: [k]}) => k], default: () => TYPE.ANYTHING}]},
		funcType:      ({positional: [k, v, k1]}) => new TYPE.Function(TYPE.Tuple.fromTypes([new TYPE.Map(k, v), k1]), undefined, new TYPE.Maybe(v)),
	}],
	['\'Map#set\'', {
		genericParams: {positional: [{}, {}]},
		funcType:      ({positional: [k, v]}) => new TYPE.Function(TYPE.Tuple.fromTypes([new TYPE.Map(k, v, true), k, v])),
	}],
]);
/**
 * API for all core lib classes.
 */
export const CLASS_API: ReadonlyMap<CoreLibName, ClassSignature> = new Map<CoreLibName, ClassSignature>([
	[CoreLibName.NULL, {
		returnType:   () => TYPE.NULL,
		instanceType: TYPE.NULL,
	}],
	[CoreLibName.BOOLEAN, {
		overloads:    () => [{positional: new TYPE.Tuple([{type: TYPE.ANYTHING, optional: true}])}],
		returnType:   () => TYPE.BOOL,
		instanceType: TYPE.BOOL,
	}],
	[CoreLibName.SYMBOL, {
		overloads:    () => [{positional: new TYPE.Tuple([{type: TYPE.SYM, optional: false}])}],
		returnType:   () => TYPE.SYM,
		instanceType: TYPE.SYM,
	}],
	[CoreLibName.INTEGER, {
		overloads:    () => [{positional: new TYPE.Tuple([{type: TYPE.NUMBER, optional: true}])}],
		returnType:   () => TYPE.INT,
		instanceType: TYPE.INT,
	}],
	[CoreLibName.NATURAL, {
		overloads:    () => [{positional: new TYPE.Tuple([{type: TYPE.NUMBER, optional: true}])}],
		returnType:   () => TYPE.NAT,
		instanceType: TYPE.NAT,
	}],
	[CoreLibName.FLOAT, {
		overloads:    () => [{positional: new TYPE.Tuple([{type: TYPE.NUMBER, optional: true}])}],
		returnType:   () => TYPE.FLOAT,
		instanceType: TYPE.FLOAT,
	}],
	[CoreLibName.STRING, {
		overloads:    () => [{positional: new TYPE.Tuple([{type: TYPE.ANYTHING, optional: true}])}],
		returnType:   () => TYPE.STR,
		instanceType: TYPE.STR,
	}],
	[CoreLibName.OBJECT, {
		returnType:   () => TYPE.OBJ,
		instanceType: TYPE.OBJ,
	}],
	[CoreLibName.LIST, {
		genericParams: {positional: [VARIANCE['out(in)']]},
		overloads:     ({positional: [t]}) => [
			{},
			{positional: TYPE.Tuple.fromTypes([new TYPE.List(t)])},
			{positional: TYPE.Tuple.fromTypes([new TYPE.Set(t)])},
		],
		returnType:   ({positional: [t]}) => new TYPE.List(t),
		instanceType: new TYPE.List(TYPE.ANYTHING),
	}],
	[CoreLibName.DICT, {
		genericParams: {positional: [VARIANCE['out(in)']]},
		overloads:     ({positional: [t]}) => [
			{},
			{positional: TYPE.Tuple.fromTypes([new TYPE.List(TYPE.Tuple.fromTypes([TYPE.SYM, t]))])},
			{positional: TYPE.Tuple.fromTypes([new TYPE.Dict(t)])},
			{positional: TYPE.Tuple.fromTypes([new TYPE.Set(TYPE.Tuple.fromTypes([TYPE.SYM, t]))])},
			{positional: TYPE.Tuple.fromTypes([new TYPE.Map(TYPE.SYM, t)])},
		],
		returnType:   ({positional: [t]}) => new TYPE.Dict(t),
		instanceType: new TYPE.Dict(TYPE.ANYTHING),
	}],
	[CoreLibName.SET, {
		genericParams: {positional: [VARIANCE['out(in)']]},
		overloads:     ({positional: [t]}) => [
			{},
			{positional: TYPE.Tuple.fromTypes([new TYPE.List(t)])},
			{positional: TYPE.Tuple.fromTypes([new TYPE.Set(t)])},
		],
		returnType:   ({positional: [t]}) => new TYPE.Set(t),
		instanceType: new TYPE.Set(TYPE.ANYTHING),
	}],
	[CoreLibName.MAP, {
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
		returnType:   ({positional: [k, v]}) => new TYPE.Map(k, v),
		instanceType: new TYPE.Map(TYPE.ANYTHING, TYPE.ANYTHING),
	}],
	[CoreLibName.EXCEPTION, {
		overloads:    () => [{positional: new TYPE.Tuple([{type: TYPE.STR, optional: false}, {type: TYPE.EXCP, optional: true}])}],
		returnType:   () => TYPE.EXCP,
		instanceType: TYPE.EXCP,
	}],
	[CoreLibName.MAYBE, {
		genericParams: {positional: [VARIANCE.out]},
		returnType:    ({positional: [t]}) => new TYPE.Maybe(t),
		instanceType:  new TYPE.Maybe(TYPE.ANYTHING),
	}],
	[CoreLibName.NONE, {
		genericParams: {positional: [VARIANCE.out]},
		overloads:     () => [{}],
		returnType:    ({positional: [t]}) => new TYPE.None(t),
		instanceType:  new TYPE.None(TYPE.ANYTHING),
	}],
	[CoreLibName.SOME, {
		genericParams: {positional: [VARIANCE.out]},
		overloads:     ({positional: [t]}) => [{positional: TYPE.Tuple.fromTypes([t])}],
		returnType:    ({positional: [t]}) => new TYPE.Some(t),
		instanceType:  new TYPE.Some(TYPE.ANYTHING),
	}],
	[CoreLibName.RESULT, {
		genericParams: {positional: [VARIANCE.out, {...VARIANCE.out, constraint: ['narrows', () => TYPE.EXCP], default: () => TYPE.EXCP}]},
		returnType:    ({positional: [t, e]}) => new TYPE.Result(t, e),
		instanceType:  new TYPE.Result(TYPE.ANYTHING),
	}],
	[CoreLibName.FAIL, {
		genericParams: {positional: [VARIANCE.out, {...VARIANCE.out, constraint: ['narrows', () => TYPE.EXCP], default: () => TYPE.EXCP}]},
		overloads:     ({positional: [_, e]}) => [{positional: TYPE.Tuple.fromTypes([e])}],
		returnType:    ({positional: [t, e]}) => new TYPE.Fail(t, e),
		instanceType:  new TYPE.Fail(TYPE.ANYTHING),
	}],
	[CoreLibName.OK, {
		genericParams: {positional: [VARIANCE.out, {...VARIANCE.out, constraint: ['narrows', () => TYPE.EXCP], default: () => TYPE.EXCP}]},
		overloads:     ({positional: [t]})    => [{positional: TYPE.Tuple.fromTypes([t])}],
		returnType:    ({positional: [t, e]}) => new TYPE.Ok(t, e),
		instanceType:  new TYPE.Ok(TYPE.ANYTHING),
	}],
	[CoreLibName.FUNCTION, {
		returnType:   () => TYPE.FUNCTION,
		instanceType: TYPE.FUNCTION,
	}],
	[CoreLibName.CLASS, {
		returnType:   () => TYPE.CLASS,
		instanceType: TYPE.CLASS,
	}],
]);



/** The class named `Class` — its instances are classes, and it is an instance of itself (argument omitted). @deprecated */
export const CLASS_CLASS = new VALUE.Class(TYPE.CLASS);
