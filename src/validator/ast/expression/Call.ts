import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	TypeErrorNotNarrow,
	TypeErrorNotCallable,
	TypeErrorArgCount,
} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {TYPE} from '../../../typer/index.ts';
import {IntrinsicName} from '../../../parser/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {
	type CallableClassName,
	CALLABLE_CLASS_NAMES,
	type ConstructorSchema,
	CLASS_API,
} from '../utils-private.ts';
import {typecheck_assign} from '../AstNode.ts';
import * as AST_TYPE from '../type/index.ts';
import type {Property} from '../Property.ts';
import {Expression} from './Expression.ts';
import {Variable} from './Variable.ts';
import {Tuple as ExpressionTuple} from './Tuple.ts';
import {Record as ExpressionRecord} from './Record.ts';



export class Call extends Expression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Call {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Call);
		return expression;
	}


	public readonly isCallableClassName: boolean;


	public constructor(
		start_node: SyntaxNodeType<'expression_compound'>,
		public  readonly base:          Expression,
		public  readonly typeargs:      readonly AST_TYPE.Type[],
		public  readonly exprargsPosit: readonly Expression[],
		private readonly exprargsNamed: readonly Property[],
	) {
		super(start_node, {}, [base, ...typeargs, ...exprargsPosit, ...exprargsNamed]);
		this.isCallableClassName = (CALLABLE_CLASS_NAMES as readonly string[]).includes(this.base.source);
	}

	public override varCheck(): void {
		if (!this.isCallableClassName) {
			this.base.varCheck();
		}
		return xjs.Array.forEachAggregated([
			...this.typeargs,
			...this.exprargsPosit,
			...this.exprargsNamed,
		], (arg) => arg.varCheck());
	}

	public override typeCheck(): void {
		// NOTE: ignore type-checking `this.base` for now, as semantics is determined by syntax.
		// (`this.base.source` must be a `CallableClassName`)
		xjs.Array.forEachAggregated([
			...this.typeargs,
			...this.exprargsPosit,
			...this.exprargsNamed,
		], (arg) => arg.typeCheck());
		this.type(); // assert does not throw
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		if (!(this.base instanceof Variable)) {
			throw new TypeErrorNotCallable(this.base.type(), this.base);
		}
		if (
			this.exprargsPosit.some((arg) => arg.type().isBottomType) ||
			this.exprargsNamed.some((arg) => arg.val.type().isBottomType)
		) {
			return TYPE.NOTHING;
		}
		const constructor_schema:    ConstructorSchema = CLASS_API.get(this.base.source as CallableClassName)!;
		const resolved_generic_args: TYPE.Type[]       = AST_TYPE.Call.checkGenericArgs(constructor_schema, this.typeargs, this);
		try {
			this.checkFunctionArgs(constructor_schema, resolved_generic_args);
		} catch (err) {
			if (err instanceof TypeErrorArgCount) {
				throw err;
			} else if (err instanceof AggregateError && err.errors.every((suberr) => suberr instanceof TypeErrorArgCount)) {
				// FIXME: should report whole AggregateError
				throw err.errors[0];
			}
			switch (this.base.source as CallableClassName) {
				case IntrinsicName.LIST: {
					// If function overload checking failed, `arg` is either a tuple literal or an expression with a tuple type.
					const itemtype: TYPE.Type  = this.typeargs[0].eval();
					const arg:      Expression = this.exprargsPosit[0];
					if (arg instanceof ExpressionTuple) {
						xjs.Array.forEachAggregated(arg.children, (item) => typecheck_assign(item, itemtype, item));
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
					break;
				}
				case IntrinsicName.DICT: {
					// If function overload checking failed, `arg` is either a tuple/record literal or an expression with a tuple/record type.
					const valuetype: TYPE.Type  = this.typeargs[0].eval();
					const entrytype: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.SYM, valuetype]);
					const arg:       Expression = this.exprargsPosit[0];
					if (arg instanceof ExpressionTuple) {
						xjs.Array.forEachAggregated(arg.children, (item) => typecheck_assign(item, entrytype, item));
					} else if (arg instanceof ExpressionRecord) {
						xjs.Array.forEachAggregated(arg.children, (prop) => typecheck_assign(prop.val, valuetype, prop.val));
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
					break;
				}
				case IntrinsicName.SET: {
					// If function overload checking failed, `arg` is either a tuple literal or an expression with a tuple type.
					const eltype: TYPE.Type  = this.typeargs[0].eval();
					const arg:    Expression = this.exprargsPosit[0];
					if (arg instanceof ExpressionTuple) {
						xjs.Array.forEachAggregated(arg.children, (item) => typecheck_assign(item, eltype, item));
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
					break;
				}
				case IntrinsicName.MAP: {
					// If function overload checking failed, `arg` is either a tuple literal or an expression with a tuple type.
					const anttype:   TYPE.Type  = this.typeargs[0].eval();
					const contype:   TYPE.Type  = this.typeargs[1]?.eval() ?? anttype;
					const entrytype: TYPE.Tuple = TYPE.Tuple.fromTypes([anttype, contype]);
					const arg:       Expression = this.exprargsPosit[0];
					if (arg instanceof ExpressionTuple) {
						xjs.Array.forEachAggregated(arg.children, (item) => typecheck_assign(item, entrytype, item));
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
					break;
				}
				default: {
					throw err;
				}
			}
		}
		const return_type: TYPE.Type = constructor_schema.returnType(resolved_generic_args);
		return return_type instanceof TYPE.ReferenceType ? return_type.mutableOf() : return_type;
	}

	/**
	 * Type-checks assignment of function arguments to a constructor call.
	 * @param constructor_schema    the name of the class constructor’s schema
	 * @param resolved_generic_args the resolved type arguments, returned by {@link AST_TYPE.Call.checkGenericArgs}
	 */
	private checkFunctionArgs(constructor_schema: ConstructorSchema, resolved_generic_args: readonly TYPE.Type[]): void {
		if (!constructor_schema.overloads.length) {
			throw new TypeErrorNotCallable(
				this.base.source === IntrinsicName.MAYBE ? new TYPE.Maybe(resolved_generic_args[0]) :
				this.base.source === IntrinsicName.RESULT ? new TYPE.Result(resolved_generic_args[0], resolved_generic_args[1]) :
				this.base.type(),
				this.base,
			);
		}
		xjs.Array.forEither(constructor_schema.overloads, (func_params) => {
			/* Argument Counting. Throws if the number of given args does not match the number of expected parameters. */
			const expected_function = {
				min: BigInt(func_params.positional?.filter((param) => !param.optional).length ?? 0),
				max: BigInt(func_params.positional?.length ?? 0),
			} as const;
			const actual_function: bigint = BigInt(this.exprargsPosit.length);
			// TODO: throw AggregateError if both
			if (actual_function < expected_function.min) {
				throw new TypeErrorArgCount(actual_function, expected_function.min, false, this);
			}
			if (actual_function > expected_function.max) {
				throw new TypeErrorArgCount(actual_function, expected_function.max, false, this);
			}

			/* Argument Typing. Handles optionality and default values. Also checks if each argument matches the constraints given. */
			func_params.positional?.forEach((param, i) => {
				const argnode: Expression | undefined = this.exprargsPosit.at(i);
				if (argnode) {
					typecheck_assign(argnode, param.type.call(null, resolved_generic_args), this);
				} else {
					assert.ok(param.optional); // we can assert this due to argument counting above
				}
			});
			func_params.named?.forEach((param, id) => {
				const argnode: Property | undefined = this.exprargsNamed.find((prop) => prop.key.id === id);
				if (argnode) {
					typecheck_assign(argnode.val, param.type.call(null, resolved_generic_args), this);
				} else if (!param.optional) {
					throw new TypeError(`Missing argument for requierd named parameter ${id}.`); // TODO: new class of CplTypeError
				}
			});
		});
	}
}
