import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	type Optimizer,
	type IR,
	TypeErrorNotCallable,
	TypeErrorArgCount,
} from '../../index.ts';
import {
	assert_instanceof,
	forEither,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {
	type ArgCount,
	ValidFunctionName,
	invalid_function_name,
} from './utils-private.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {ASTNodeType} from './ASTNodeType.ts';
import {
	lowerDeco,
	buildDeco,
	typeDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.ts';
import {ASTNodeVariable} from './ASTNodeVariable.ts';
import {ASTNodeTuple} from './ASTNodeTuple.ts';
import {ASTNodeRecord} from './ASTNodeRecord.ts';



export class ASTNodeCall extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeCall {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeCall);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'expression_compound'>,
		private readonly base: ASTNodeExpression,
		private readonly typeargs: readonly ASTNodeType[],
		private readonly exprargs: readonly ASTNodeExpression[],
	) {
		super(start_node, {}, [base, ...typeargs, ...exprargs]);
	}

	public override varCheck(): void {
		// NOTE: ignore var-checking `this.base` for now, as semantics is determined by syntax.
		// (`this.base.source` must be a `ValidFunctionName`)
		return xjs.Array.forEachAggregated([
			...this.typeargs,
			...this.exprargs,
		], (arg) => arg.varCheck());
	}

	public override typeCheck(): void {
		// NOTE: ignore var-checking `this.base` for now, as semantics is determined by syntax.
		// (`this.base.source` must be a `ValidFunctionName`)
		xjs.Array.forEachAggregated([
			...this.typeargs,
			...this.exprargs,
		], (arg) => arg.typeCheck());
		this.type(); // assert does not throw
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		throw new Error('`ASTNodeCall#build` not yet supported.');
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		if (!(this.base instanceof ASTNodeVariable)) {
			throw new TypeErrorNotCallable(this.base.type(), this.base);
		}
		switch (this.base.source) {
			/*
			 * API:
			 * ```cp
			 * declare class List<T> {
			 * 	new ();
			 * 	new (tup0:  ());
			 * 	new (tup1:  (T,));
			 * 	new (tup2:  (T, T));
			 * 	new (tup:   unknown); % any tuple type with items of type `T`
			 * 	new (list:  List.<T>);
			 * 	new ('set': Set.<T>);
			 * }
			 * ```
			 */
			case ValidFunctionName.LIST: {
				this.countArgs(1n, [0n, 2n]);
				const itemtype:         TYPE.Type            = this.typeargs[0].eval();
				const returntype                             = new TYPE.List(itemtype);
				const allowed_argtypes: readonly TYPE.Type[] = [
					new TYPE.Set(itemtype),
					returntype,
				];
				if (this.exprargs.length) {
					const arg: ASTNodeExpression = this.exprargs[0];
					try {
						forEither(allowed_argtypes, (allowed_type) => ASTNodeCP.typeCheckAssign(arg, allowed_type, this));
					} catch (err) {
						// If `arg` is not an allowed type, it’s either a tuple literal or an expression with a tuple type.
						if (arg instanceof ASTNodeTuple) {
							xjs.Array.forEachAggregated(arg.children, (item) => ASTNodeCP.typeCheckAssign(item, itemtype, item));
						} else {
							const argtype: TYPE.Type = arg.type();
							if (argtype instanceof TYPE.Tuple) {
								ASTNodeCP.checkSubtype(argtype.itemTypes(), itemtype, this);
							} else {
								throw err;
							}
						}
					}
				}
				return returntype.mutableOf();
			}
			/*
			 * API:
			 * ```cp
			 * declare class Dict<T> {
			 * 	new ();
			 * 	new (tup0:  ());
			 * 	new (tup1:  ((sym, T),));
			 * 	new (tup2:  ((sym, T), (sym, T)));
			 * 	new (tup:   unknown); % any tuple type with items of type `(sym, T)`
			 * 	new (recA:  (a: T));
			 * 	new (recAB: (a: T, b: T));
			 * 	new (rec:   unknown); % any record type with values of type `T`
			 * 	new (list:  List.<(sym, T)>);
			 * 	new (dict:  Dict.<T>);
			 * 	new ('set': Set.<(sym, T)>);
			 * 	new (map:   Map.<sym, T>);
			 * }
			 * ```
			 */
			case ValidFunctionName.DICT: {
				this.countArgs(1n, [0n, 2n]);
				const valuetype:        TYPE.Type            = this.typeargs[0].eval();
				const returntype                             = new TYPE.Dict(valuetype);
				const entrytype:        TYPE.Tuple           = TYPE.Tuple.fromTypes([TYPE.SYM, valuetype]);
				const allowed_argtypes: readonly TYPE.Type[] = [
					new TYPE.List(entrytype),
					new TYPE.Set(entrytype),
					new TYPE.Map(TYPE.SYM, valuetype),
					returntype,
				];
				if (this.exprargs.length) {
					const arg: ASTNodeExpression = this.exprargs[0];
					try {
						forEither(allowed_argtypes, (allowed_type) => ASTNodeCP.typeCheckAssign(arg, allowed_type, this));
					} catch (err) {
						// If `arg` is not an allowed type, it’s either a tuple/record literal or an expression with a tuple/record type.
						if (arg instanceof ASTNodeTuple) {
							xjs.Array.forEachAggregated(arg.children, (item) => ASTNodeCP.typeCheckAssign(item, entrytype, item));
						} else if (arg instanceof ASTNodeRecord) {
							xjs.Array.forEachAggregated(arg.children, (prop) => ASTNodeCP.typeCheckAssign(prop.val, valuetype, prop.val));
						} else {
							const argtype: TYPE.Type = arg.type();
							if (argtype instanceof TYPE.Tuple) {
								ASTNodeCP.checkSubtype(argtype.itemTypes(), entrytype, this);
							} else if (argtype instanceof TYPE.Record) {
								ASTNodeCP.checkSubtype(argtype.valueTypes(), valuetype, this);
							} else {
								throw err;
							}
						}
					}
				}
				return returntype.mutableOf();
			}
			/*
			 * API:
			 * ```cp
			 * declare class Set<T> {
			 * 	new ();
			 * 	new (tup0:  ());
			 * 	new (tup1:  (T,));
			 * 	new (tup2:  (T, T));
			 * 	new (tup:   unknown); % any tuple type with items of type `T`
			 * 	new (list:  List.<T>);
			 * 	new ('set': Set.<T>);
			 * }
			 * ```
			 */
			case ValidFunctionName.SET: {
				this.countArgs(1n, [0n, 2n]);
				const eltype:           TYPE.Type            = this.typeargs[0].eval();
				const returntype                             = new TYPE.Set(eltype);
				const allowed_argtypes: readonly TYPE.Type[] = [
					new TYPE.List(eltype),
					returntype,
				];
				if (this.exprargs.length) {
					const arg: ASTNodeExpression = this.exprargs[0];
					try {
						forEither(allowed_argtypes, (allowed_type) => ASTNodeCP.typeCheckAssign(arg, allowed_type, this));
					} catch (err) {
						// If `arg` is not an allowed type, it’s either a tuple literal or an expression with a tuple type.
						if (arg instanceof ASTNodeTuple) {
							xjs.Array.forEachAggregated(arg.children, (item) => ASTNodeCP.typeCheckAssign(item, eltype, item));
						} else {
							const argtype: TYPE.Type = arg.type();
							if (argtype instanceof TYPE.Tuple) {
								ASTNodeCP.checkSubtype(argtype.itemTypes(), eltype, this);
							} else {
								throw err;
							}
						}
					}
				}
				return returntype.mutableOf();
			}
			/*
			 * API:
			 * ```cp
			 * declare class Map<K, V> {
			 * 	new ();
			 * 	new (tup0:  ());
			 * 	new (tup1:  ((K, V),));
			 * 	new (tup2:  ((K, V), (K, V)));
			 * 	new (tup:   unknown); % any tuple type with items of type `(K, V)`
			 * 	new (list:  List.<(K, V)>);
			 * 	new ('set': Set.<(K, V)>);
			 * 	new (map:   Map.<K, V>);
			 * }
			 * ```
			 */
			case ValidFunctionName.MAP: {
				this.countArgs([1n, 3n], [0n, 2n]);
				const anttype:          TYPE.Type            = this.typeargs[0].eval();
				const contype:          TYPE.Type            = this.typeargs[1]?.eval() ?? anttype;
				const returntype                             = new TYPE.Map(anttype, contype);
				const entrytype:        TYPE.Tuple           = TYPE.Tuple.fromTypes([anttype, contype]);
				const allowed_argtypes: readonly TYPE.Type[] = [
					new TYPE.List(entrytype),
					new TYPE.Set(entrytype),
					returntype,
				];
				if (this.exprargs.length) {
					const arg: ASTNodeExpression = this.exprargs[0];
					try {
						forEither(allowed_argtypes, (allowed_type) => ASTNodeCP.typeCheckAssign(arg, allowed_type, this));
					} catch (err) {
						// If `arg` is not an allowed type, it’s either a tuple literal or an expression with a tuple type.
						if (arg instanceof ASTNodeTuple) {
							xjs.Array.forEachAggregated(arg.children, (item) => ASTNodeCP.typeCheckAssign(item, entrytype, item));
						} else {
							const argtype: TYPE.Type = arg.type();
							if (argtype instanceof TYPE.Tuple) {
								ASTNodeCP.checkSubtype(argtype.itemTypes(), entrytype, this);
							} else {
								throw err;
							}
						}
					}
				}
				return returntype.mutableOf();
			}
			default: {
				invalid_function_name(this.base.source);
			}
		}
	}

	@memoizeMethod
	@lowerDeco
	public override lower(_: Optimizer): IR.Value {
		throw new Error('`ASTNodeCall#lower` not yet supported.');
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const args: readonly (VALUE.Value | null)[] = this.exprargs.map((c) => c.fold()); // TODO: `#fold` should not return native `null` if it cannot assess
		if (args.includes(null)) {
			return null;
		}
		switch (this.base.source) {
			case ValidFunctionName.LIST: {
				if (!args.length) {
					return new VALUE.List();
				}
				const arg: VALUE.Value = args[0]!;
				return new VALUE.List((
					arg instanceof VALUE.Set                        ? [...arg.elements] :
					(assert_instanceof(arg, VALUE.CollectionIndexed), arg.items)
				));
			}
			case ValidFunctionName.DICT: {
				if (!args.length) {
					return new VALUE.Dict();
				}
				const arg: VALUE.Value = args[0]!;
				return new VALUE.Dict((
					arg instanceof VALUE.CollectionIndexed        ? new Map<bigint, VALUE.Value>((arg.items       as VALUE.Tuple[])                .map((tup) => [(tup.items[0] as VALUE.Symbol).id, tup.items[1]])) :
					arg instanceof VALUE.Set                      ? new Map<bigint, VALUE.Value>([...arg.elements as Set<VALUE.Tuple>]             .map((tup) => [(tup.items[0] as VALUE.Symbol).id, tup.items[1]])) :
					arg instanceof VALUE.Map                      ? new Map<bigint, VALUE.Value>([...arg.cases    as Map<VALUE.Value, VALUE.Value>].map((ent) => [(ent[0]       as VALUE.Symbol).id, ent[1]])) :
					(assert_instanceof(arg, VALUE.CollectionKeyed), arg.properties)
				));
			}
			case ValidFunctionName.SET: {
				if (!args.length) {
					return new VALUE.Set();
				}
				const arg: VALUE.Value = args[0]!;
				return new VALUE.Set((
					arg instanceof VALUE.CollectionIndexed ? new Set<VALUE.Value>(arg.items) :
					(assert_instanceof(arg, VALUE.Set),      arg.elements)
				));
			}
			case ValidFunctionName.MAP: {
				if (!args.length) {
					return new VALUE.Map();
				}
				const arg: VALUE.Value = args[0]!;
				return new VALUE.Map((
					arg instanceof VALUE.CollectionIndexed ? new Map<VALUE.Value, VALUE.Value>((arg.items       as VALUE.Tuple[])   .map((tup) => tup.items as [VALUE.Value, VALUE.Value])) :
					arg instanceof VALUE.Set               ? new Map<VALUE.Value, VALUE.Value>([...arg.elements as Set<VALUE.Tuple>].map((tup) => tup.items as [VALUE.Value, VALUE.Value])) :
					(assert_instanceof(arg, VALUE.Map),      arg.cases)
				));
			}
			default: {
				invalid_function_name(this.base.source);
			}
		}
	}

	/**
	 * Count this call’s number of actual arguments and compare it to the number of expected arguments,
	 * and throw if the number is incorrect.
	 * Each given argument may be a single value or a 2-tuple of values representing a range.
	 * If a 2-tuple, the first item represents the minimum (inclusive),
	 * and the second item represents the maximum (exclusive).
	 * E.g., `countArgs([2n, 5n])` expects 2, 3, or 4 arguments, but not 5.
	 * @param expected_generic  - the number of expected generic arguments, or a half-open range
	 * @param expected_function - the number of expected function arguments, or a half-open range
	 * @throws if this call’s number of actual arguments does not satisfy the expected number
	 */
	private countArgs(expected_generic: ArgCount, expected_function: ArgCount): void {
		const actual_generic:  bigint = BigInt(this.typeargs.length);
		const actual_function: bigint = BigInt(this.exprargs.length);
		if (typeof expected_generic === 'bigint') {
			expected_generic = [expected_generic, expected_generic + 1n];
		}
		if (typeof expected_function === 'bigint') {
			expected_function = [expected_function, expected_function + 1n];
		}
		if (actual_generic < expected_generic[0]) {
			throw new TypeErrorArgCount(actual_generic, expected_generic[0], true, this);
		}
		if (expected_generic[1] <= actual_generic) {
			throw new TypeErrorArgCount(actual_generic, expected_generic[1] - 1n, true, this);
		}
		if (actual_function < expected_function[0]) {
			throw new TypeErrorArgCount(actual_function, expected_function[0], false, this);
		}
		if (expected_function[1] <= actual_function) {
			throw new TypeErrorArgCount(actual_function, expected_function[1] - 1n, false, this);
		}
	}
}
