import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	type IR,
	TypeErrorNotNarrow,
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
	ValidFunctionName,
	check_valid_function_name,
	type ConstructorSchema,
	CLASS_API,
} from './utils-private.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {ASTNodeType} from './ASTNodeType.ts';
import {ASTNodeTypeCall} from './ASTNodeTypeCall.ts';
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
		check_valid_function_name(this.base.source);
		return xjs.Array.forEachAggregated([
			...this.typeargs,
			...this.exprargs,
		], (arg) => arg.varCheck());
	}

	public override typeCheck(): void {
		// NOTE: ignore type-checking `this.base` for now, as semantics is determined by syntax.
		// (`this.base.source` must be a `ValidFunctionName`)
		xjs.Array.forEachAggregated([
			...this.typeargs,
			...this.exprargs,
		], (arg) => arg.typeCheck());
		this.type(); // assert does not throw
	}

	@memoizeMethod
	@lowerDeco
	public override lower(): IR.Value {
		throw new Error('`ASTNodeCall#lower` not yet supported.');
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
		const constructor_schema:    ConstructorSchema = CLASS_API.get(this.base.source as ValidFunctionName)!;
		const resolved_generic_args: TYPE.Type[]       = ASTNodeTypeCall.checkGenericArgs(constructor_schema, this.typeargs, this);
		switch (this.base.source as ValidFunctionName) {
			case ValidFunctionName.LIST: {
				try {
					this.checkFunctionArgs(constructor_schema, resolved_generic_args);
				} catch (err) {
					if (err instanceof TypeErrorArgCount) {
						throw err;
					} else if (err instanceof AggregateError && err.errors.every((suberr) => suberr instanceof TypeErrorArgCount)) {
						// FIXME: should report whole AggregateError
						throw err.errors[0];
					}
					// If function overload checking failed, `arg` is either a tuple literal or an expression with a tuple type.
					const itemtype: TYPE.Type         = this.typeargs[0].eval();
					const arg:      ASTNodeExpression = this.exprargs[0];
					if (arg instanceof ASTNodeTuple) {
						xjs.Array.forEachAggregated(arg.children, (item) => ASTNodeCP.typeCheckAssign(item, itemtype, item));
					} else {
						const argtype: TYPE.Type = arg.type();
						if (argtype instanceof TYPE.Tuple) {
							const tupleitemtypes: TYPE.Type = argtype.itemTypes();
							if (!tupleitemtypes.isSubtypeOf(itemtype)) {
								throw new TypeErrorNotNarrow(tupleitemtypes, itemtype, this.line_index, this.col_index);
							}
						} else {
							throw err;
						}
					}
				}
				break;
			}
			case ValidFunctionName.DICT: {
				try {
					this.checkFunctionArgs(constructor_schema, resolved_generic_args);
				} catch (err) {
					if (err instanceof TypeErrorArgCount) {
						throw err;
					} else if (err instanceof AggregateError && err.errors.every((suberr) => suberr instanceof TypeErrorArgCount)) {
						// FIXME: should report whole AggregateError
						throw err.errors[0];
					}
					// If function overload checking failed, `arg` is either a tuple/record literal or an expression with a tuple/record type.
					const valuetype: TYPE.Type         = this.typeargs[0].eval();
					const entrytype: TYPE.Tuple        = TYPE.Tuple.fromTypes([TYPE.SYM, valuetype]);
					const arg:       ASTNodeExpression = this.exprargs[0];
					if (arg instanceof ASTNodeTuple) {
						xjs.Array.forEachAggregated(arg.children, (item) => ASTNodeCP.typeCheckAssign(item, entrytype, item));
					} else if (arg instanceof ASTNodeRecord) {
						xjs.Array.forEachAggregated(arg.children, (prop) => ASTNodeCP.typeCheckAssign(prop.val, valuetype, prop.val));
					} else {
						const argtype: TYPE.Type = arg.type();
						if (argtype instanceof TYPE.Tuple) {
							const tupleitemtypes: TYPE.Type = argtype.itemTypes();
							if (!tupleitemtypes.isSubtypeOf(entrytype)) {
								throw new TypeErrorNotNarrow(tupleitemtypes, entrytype, this.line_index, this.col_index);
							}
						} else if (argtype instanceof TYPE.Record) {
							const recordvaluetypes: TYPE.Type = argtype.valueTypes();
							if (!recordvaluetypes.isSubtypeOf(valuetype)) {
								throw new TypeErrorNotNarrow(recordvaluetypes, valuetype, this.line_index, this.col_index);
							}
						} else {
							throw err;
						}
					}
				}
				break;
			}
			case ValidFunctionName.SET: {
				try {
					this.checkFunctionArgs(constructor_schema, resolved_generic_args);
				} catch (err) {
					if (err instanceof TypeErrorArgCount) {
						throw err;
					} else if (err instanceof AggregateError && err.errors.every((suberr) => suberr instanceof TypeErrorArgCount)) {
						// FIXME: should report whole AggregateError
						throw err.errors[0];
					}
					// If function overload checking failed, `arg` is either a tuple literal or an expression with a tuple type.
					const eltype: TYPE.Type         = this.typeargs[0].eval();
					const arg:    ASTNodeExpression = this.exprargs[0];
					if (arg instanceof ASTNodeTuple) {
						xjs.Array.forEachAggregated(arg.children, (item) => ASTNodeCP.typeCheckAssign(item, eltype, item));
					} else {
						const argtype: TYPE.Type = arg.type();
						if (argtype instanceof TYPE.Tuple) {
							const tupleitemtypes: TYPE.Type = argtype.itemTypes();
							if (!tupleitemtypes.isSubtypeOf(eltype)) {
								throw new TypeErrorNotNarrow(tupleitemtypes, eltype, this.line_index, this.col_index);
							}
						} else {
							throw err;
						}
					}
				}
				break;
			}
			case ValidFunctionName.MAP: {
				try {
					this.checkFunctionArgs(constructor_schema, resolved_generic_args);
				} catch (err) {
					if (err instanceof TypeErrorArgCount) {
						throw err;
					} else if (err instanceof AggregateError && err.errors.every((suberr) => suberr instanceof TypeErrorArgCount)) {
						// FIXME: should report whole AggregateError
						throw err.errors[0];
					}
					// If function overload checking failed, `arg` is either a tuple literal or an expression with a tuple type.
					const anttype:   TYPE.Type         = this.typeargs[0].eval();
					const contype:   TYPE.Type         = this.typeargs[1]?.eval() ?? anttype;
					const entrytype: TYPE.Tuple        = TYPE.Tuple.fromTypes([anttype, contype]);
					const arg:       ASTNodeExpression = this.exprargs[0];
					if (arg instanceof ASTNodeTuple) {
						xjs.Array.forEachAggregated(arg.children, (item) => ASTNodeCP.typeCheckAssign(item, entrytype, item));
					} else {
						const argtype: TYPE.Type = arg.type();
						if (argtype instanceof TYPE.Tuple) {
							const tupleitemtypes: TYPE.Type = argtype.itemTypes();
							if (!tupleitemtypes.isSubtypeOf(entrytype)) {
								throw new TypeErrorNotNarrow(tupleitemtypes, entrytype, this.line_index, this.col_index);
							}
						} else {
							throw err;
						}
					}
				}
				break;
			}
		}
		return constructor_schema.returnType(resolved_generic_args).mutableOf();
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const args: readonly (VALUE.Value | null)[] = this.exprargs.map((c) => c.fold()); // TODO: `#fold` should not return native `null` if it cannot assess
		if (args.includes(null)) {
			return null;
		}
		switch (this.base.source as ValidFunctionName) {
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
		}
	}

	/**
	 * Type-checks assignment of function arguments to a constructor call.
	 * @param constructor_schema    the name of the class constructor’s schema
	 * @param resolved_generic_args the resolved type arguments, returned by {@link ASTNodeTypeCall.checkGenericArgs}
	 */
	private checkFunctionArgs(constructor_schema: ConstructorSchema, resolved_generic_args: readonly TYPE.Type[]): void {
		forEither(constructor_schema.overloads, (func_params) => {
			/* Argument Counting. Throws if the number of given args does not match the number of expected parameters. */
			const expected_function = {
				min: BigInt(func_params.filter((param) => !param.optional).length),
				max: BigInt(func_params.length),
			} as const;
			const actual_generic: bigint = BigInt(this.exprargs.length);
			// TODO: throw AggregateError if both
			if (actual_generic < expected_function.min) {
				throw new TypeErrorArgCount(actual_generic, expected_function.min, false, this);
			}
			if (actual_generic > expected_function.max) {
				throw new TypeErrorArgCount(actual_generic, expected_function.max, false, this);
			}

			/* Argument Typing. Handles optionality and default values. Also checks if each argument matches the constraints given. */
			func_params.forEach((param, i) => {
				if (!this.exprargs.at(i)) {
					assert.ok(param.optional); // we can assert this due to argument counting above
				}
				const argnode: ASTNodeExpression | undefined = this.exprargs.at(i);
				if (argnode) {
					ASTNodeCP.typeCheckAssign(argnode, param.type.call(null, resolved_generic_args), this);
				}
			});
		});
	}
}
