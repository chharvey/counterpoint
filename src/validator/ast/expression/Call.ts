import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	type Builder,
	OP,
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
import type {SyntaxNodeType} from '../../utils-private.ts';
import {
	ValidFunctionName,
	type ValidGenericFunctionName,
	check_valid_function_name,
	type ConstructorSchema,
	CLASS_API,
} from '../utils-private.ts';
import {typecheck_assign} from '../AstNode.ts';
import * as AST_TYPE from '../type/index.ts';
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

	public constructor(
		start_node: SyntaxNodeType<'expression_compound'>,
		private readonly base:     Expression,
		private readonly typeargs: readonly AST_TYPE.Type[],
		private readonly exprargs: readonly Expression[],
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
	public override type(): TYPE.Type {
		if (!(this.base instanceof Variable)) {
			throw new TypeErrorNotCallable(this.base.type(), this.base);
		}
		if (this.exprargs.some((arg) => arg.type().isBottomType)) {
			return TYPE.NOTHING;
		}
		const constructor_schema:    ConstructorSchema = CLASS_API.get(this.base.source as ValidFunctionName)!;
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
			switch (this.base.source as ValidFunctionName) {
				case ValidFunctionName.LIST: {
					// If function overload checking failed, `arg` is either a tuple literal or an expression with a tuple type.
					const itemtype: TYPE.Type  = this.typeargs[0].eval();
					const arg:      Expression = this.exprargs[0];
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
				case ValidFunctionName.DICT: {
					// If function overload checking failed, `arg` is either a tuple/record literal or an expression with a tuple/record type.
					const valuetype: TYPE.Type  = this.typeargs[0].eval();
					const entrytype: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.SYM, valuetype]);
					const arg:       Expression = this.exprargs[0];
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
				case ValidFunctionName.SET: {
					// If function overload checking failed, `arg` is either a tuple literal or an expression with a tuple type.
					const eltype: TYPE.Type  = this.typeargs[0].eval();
					const arg:    Expression = this.exprargs[0];
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
				case ValidFunctionName.MAP: {
					// If function overload checking failed, `arg` is either a tuple literal or an expression with a tuple type.
					const anttype:   TYPE.Type  = this.typeargs[0].eval();
					const contype:   TYPE.Type  = this.typeargs[1]?.eval() ?? anttype;
					const entrytype: TYPE.Tuple = TYPE.Tuple.fromTypes([anttype, contype]);
					const arg:       Expression = this.exprargs[0];
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
		return constructor_schema.returnType(resolved_generic_args).mutableOf();
	}

	@memoizeMethod
	public override build(builder: Builder): OP.Value {
		/*
		 * Note: Eventually, calls will be dynamic; all we’d need to return is a new `OP.Call` object.
		 * But until we get functions and classes, statically build the function calls.
		 */
		if (false) { // eslint-disable-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
			return new OP.Call(
				this.base.build(builder).asTac(builder),
				this.exprargs.map((arg) => arg.build(builder).asTac(builder)),
				this.type(),
			);
		}

		const base_source = this.base.source as ValidFunctionName;
		switch (base_source) {
			case ValidFunctionName.BOOLEAN:
			case ValidFunctionName.INTEGER:
			case ValidFunctionName.NATURAL:
			case ValidFunctionName.FLOAT:
			case ValidFunctionName.STRING: {
				return new OP.Unop(new Map<ValidFunctionName, OP.OpCodeUn>([
					[ValidFunctionName.BOOLEAN, OP.OpCode.BOOL_FROM],
					[ValidFunctionName.INTEGER, OP.OpCode.INT_FROM],
					[ValidFunctionName.NATURAL, OP.OpCode.NAT_FROM],
					[ValidFunctionName.FLOAT,   OP.OpCode.FLOAT_FROM],
					[ValidFunctionName.STRING,  OP.OpCode.STR_FROM],
				]).get(base_source)!, this.exprargs[0].build(builder).asTac(builder), this.type());
			}
			case ValidFunctionName.LIST:
			case ValidFunctionName.DICT:
			case ValidFunctionName.SET:
			case ValidFunctionName.MAP: {
				const [name, ctor] = new Map<ValidGenericFunctionName, [OP.CollectionDynamicName, () => OP.Value]>([
					[ValidFunctionName.LIST, [OP.TypeName.LIST, () => new OP.CollectionLinearNew(OP.TypeName.LIST, [], this.type())]],
					[ValidFunctionName.SET, [OP.TypeName.SET, () => new OP.CollectionLinearNew(OP.TypeName.SET, [], this.type())]],
					[ValidFunctionName.DICT, [OP.TypeName.DICT, () => new OP.DictNew(new Map(), this.type())]],
					[ValidFunctionName.MAP, [OP.TypeName.MAP, () => new OP.MapNew(new Map(), this.type())]],
				]).get(base_source)!;
				const new_obj: OP.Value = ctor();
				if (!this.exprargs.length) {
					return new_obj;
				}
				const dest: OP.ValueTac = new_obj.asTac(builder);
				builder.pushInstruction(new OP.CollectionDynamicCopy(name, dest, this.exprargs[0].build(builder).asTac(builder)));
				return dest;
			}
			case ValidFunctionName.NONE:
			case ValidFunctionName.SOME: {
				return new OP.MaybeNew(this.typeargs[0].eval(), this.exprargs[0]?.build(builder).asTac(builder));
			}
			default: {
				assert.fail(`Did not expect base '${ base_source }'.`);
			}
		}
	}

	/**
	 * Type-checks assignment of function arguments to a constructor call.
	 * @param constructor_schema    the name of the class constructor’s schema
	 * @param resolved_generic_args the resolved type arguments, returned by {@link AST_TYPE.Call.checkGenericArgs}
	 */
	private checkFunctionArgs(constructor_schema: ConstructorSchema, resolved_generic_args: readonly TYPE.Type[]): void {
		if (!constructor_schema.overloads.length) {
			throw new TypeErrorNotCallable(
				this.base.source === ValidFunctionName.MAYBE ? new TYPE.Maybe(resolved_generic_args[0]) : this.base.type(),
				this.base,
			);
		}
		xjs.Array.forEither(constructor_schema.overloads, (func_params) => {
			/* Argument Counting. Throws if the number of given args does not match the number of expected parameters. */
			const expected_function = {
				min: BigInt(func_params.filter((param) => !param.optional).length),
				max: BigInt(func_params.length),
			} as const;
			const actual_function: bigint = BigInt(this.exprargs.length);
			// TODO: throw AggregateError if both
			if (actual_function < expected_function.min) {
				throw new TypeErrorArgCount(actual_function, expected_function.min, false, this);
			}
			if (actual_function > expected_function.max) {
				throw new TypeErrorArgCount(actual_function, expected_function.max, false, this);
			}

			/* Argument Typing. Handles optionality and default values. Also checks if each argument matches the constraints given. */
			func_params.forEach((param, i) => {
				if (!this.exprargs.at(i)) {
					assert.ok(param.optional); // we can assert this due to argument counting above
				}
				const argnode: Expression | undefined = this.exprargs.at(i);
				if (argnode) {
					typecheck_assign(argnode, param.type.call(null, resolved_generic_args), this);
				}
			});
		});
	}
}
