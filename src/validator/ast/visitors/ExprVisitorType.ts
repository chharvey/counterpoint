import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	TypeError as CplTypeError,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNotAssignable,
	TypeErrorNotCallable,
	TypeErrorArgCount,
	TypeErrorAmbiguousOverload,
} from '../../../index.ts';
import {assert_instanceof} from '../../../lib/index.ts';
import {
	type EntryType,
	TYPE,
} from '../../../typer/index.ts';
import {IntrinsicName} from '../../../parser/index.ts';
import {
	type SymbolSchema,
	SymbolSchemaVar,
	SymbolSchemaFunc,
	SymbolSchemaClass,
} from '../../index.ts';
import {Operator} from '../../Operator.ts';
import {
	only_errors_of_type,
	type CallableClassName,
	type ConstructorSchema,
	CLASS_API,
	get_entry_info,
} from '../utils-private.ts';
import {CompletionKind} from '../CompletionKind.ts';
import {typecheck_assign} from '../AstNode.ts';
import type {Functionlike} from '../Functionlike.ts';
import type {Property} from '../Property.ts';
import * as AST_TYPE from '../type/index.ts';
import * as EXPR from '../expression/index.ts';
import * as STMT from '../statement/index.ts';
import {
	bothInts,
	bothNats,
	bothFloats,
	bothNumbers,
} from './utils.ts';
import {AstNodeVisitorCompletion} from './AstNodeVisitorCompletion.ts';



export function memoizeExpressionType<Param extends EXPR.Expression>(
	method:   (this: ExprVisitorType, arg: Param) => TYPE.Type | null,
	_context: ClassMethodDecoratorContext<ExprVisitorType, typeof method>,
): typeof method {
	return function (arg) {
		// set, then get
		arg.type = method.bind(this, arg);
		return arg.type;
	};
}



export class ExprVisitorType extends EXPR.ExprVisitor<TYPE.Type | null> {
	readonly #astNodeVisitorCompletion = new AstNodeVisitorCompletion();


	@memoizeExpressionType
	public override visitConstant(expr: EXPR.Constant): TYPE.Type | null {
		return expr.interpreterValue.toType();
	}

	@memoizeExpressionType
	public override visitTemplate(expr: EXPR.Template): TYPE.Type | null {
		if (xjs.Array.mapAggregated(expr.children, (item) => this.throwIfVoid(item, new TypeErrorNotAssignable(item, TYPE.STR))).some((t) => t.isBottomType)) {
			return TYPE.NOTHING;
		}
		return TYPE.STR;
	}

	@memoizeExpressionType
	public override visitVariable(expr: EXPR.Variable): TYPE.Type | null {
		assert.ok(expr.validator.hasSymbol(expr.id), `Expected ${expr.source} (${expr.id}) to be in the symbol table.`);
		const symbol: SymbolSchema = expr.validator.getSymbol(expr.id)!;
		if (symbol instanceof SymbolSchemaVar) {
			return symbol.isUninitialized ? new TYPE.Maybe(symbol.type) : symbol.type;
		} else {
			assert_instanceof(symbol, SymbolSchemaClass);
			return TYPE.CLASS;
		}
	}

	@memoizeExpressionType
	public override visitTuple(expr: EXPR.Tuple): TYPE.Type | null {
		const types: readonly TYPE.Type[] = xjs.Array.mapAggregated(expr.children, (item) => this.throwIfVoid(item));
		if (types.some((t) => t.isBottomType)) {
			return TYPE.NOTHING;
		}
		return TYPE.Tuple.fromTypes(types);
	}

	@memoizeExpressionType
	public override visitRecord(expr: EXPR.Record): TYPE.Type | null {
		const proptypes = new Map<bigint, TYPE.Type>(xjs.Array.mapAggregated(expr.children, (prop) => [
			prop.key.id,
			this.throwIfVoid(prop.val),
		]));
		if (proptypes.values().some((typ) => typ.isBottomType)) {
			return TYPE.NOTHING;
		}
		return TYPE.Record.fromTypes(proptypes);
	}

	@memoizeExpressionType
	public override visitList(expr: EXPR.List): TYPE.Type | null {
		const types: readonly TYPE.Type[] = xjs.Array.mapAggregated(expr.children, (item) => this.throwIfVoid(item));
		if (types.some((t) => t.isBottomType)) {
			return TYPE.NOTHING;
		}
		return new TYPE.List(
			TYPE.Union.all(...types),
			true,
		);
	}

	@memoizeExpressionType
	public override visitDict(expr: EXPR.Dict): TYPE.Type | null {
		const types: readonly TYPE.Type[] = xjs.Array.mapAggregated(expr.children, (prop) => this.throwIfVoid(prop.val));
		if (types.some((typ) => typ.isBottomType)) {
			return TYPE.NOTHING;
		}
		return new TYPE.Dict(
			TYPE.Union.all(...types),
			true,
		);
	}

	@memoizeExpressionType
	public override visitSet(expr: EXPR.Set): TYPE.Type | null {
		const types: readonly TYPE.Type[] = xjs.Array.mapAggregated(expr.children, (item) => this.throwIfVoid(item));
		if (types.some((t) => t.isBottomType)) {
			return TYPE.NOTHING;
		}
		return new TYPE.Set(
			TYPE.Union.all(...types),
			true,
		);
	}

	@memoizeExpressionType
	public override visitMap(expr: EXPR.Map): TYPE.Type | null {
		const casetypes: readonly (readonly [TYPE.Type, TYPE.Type])[] = xjs.Array.mapAggregated(expr.children, (kase) => [
			this.throwIfVoid(kase.antecedents[0]),
			this.throwIfVoid(kase.consequent),
		]);
		if (casetypes.some((kase) => kase[0].isBottomType || kase[1].isBottomType)) {
			return TYPE.NOTHING;
		}
		return new TYPE.Map(
			TYPE.Union.all(...casetypes.map((kase) => kase[0])),
			TYPE.Union.all(...casetypes.map((kase) => kase[1])),
			true,
		);
	}

	@memoizeExpressionType
	public override visitExprBlock(expr: EXPR.ExpressionBlock): TYPE.Type | null {
		if (this.#astNodeVisitorCompletion.visit(expr.block) !== CompletionKind.NORMAL) {
			return TYPE.NOTHING;
		}
		assert.ok(expr.block.children.length, 'Expected Block to contain at least 1 statement.');
		const last_stmt: STMT.Statement = expr.block.children.at(-1)!;
		if (!(last_stmt instanceof STMT.StatementExpression)) {
			return null;
		}
		const last_expr: EXPR.Expression | undefined = last_stmt.expr;
		if (!last_expr) {
			return null;
		}
		return this.visit(last_expr);
	}

	@memoizeExpressionType
	public override visitAccess(expr: EXPR.Access): TYPE.Type | null {
		const base_type: TYPE.Type = this.throwIfVoid(expr.base, new TypeErrorInvalidOperation(expr));
		if (base_type.isBottomType) {
			return TYPE.NOTHING;
		}
		if (expr.kind === Operator.DOT_MAYBE) {
			if (base_type instanceof TYPE.Maybe) {
				const entry: EntryType = get_entry_info(base_type.typearg, expr);
				expr.isEntryOptional = entry.optional;
				return new TYPE.Maybe(entry.optional ? new TYPE.Maybe(entry.type) : entry.type);
			} else if (!(expr.accessor instanceof EXPR.Expression)) { // TODO: remove expression access
				throw new TypeErrorInvalidOperation(expr);
			}
		}
		if (expr.kind === Operator.DOT_RESULT) {
			if (base_type instanceof TYPE.Result) {
				const entry: EntryType = get_entry_info(base_type.typeargSuccess, expr);
				expr.isEntryOptional = entry.optional;
				return new TYPE.Result(entry.optional ? new TYPE.Maybe(entry.type) : entry.type, base_type.typeargFailure);
			} else {
				throw new TypeErrorInvalidOperation(expr);
			}
		} else {
			const entry: EntryType = get_entry_info(base_type, expr);
			expr.isEntryOptional = entry.optional;
			return entry.optional ? new TYPE.Maybe(entry.type) : entry.type;
		}
	}

	@memoizeExpressionType
	public override visitCall(expr: EXPR.Call): TYPE.Type | null {
		const symbol: SymbolSchema | undefined = expr.base instanceof EXPR.Variable ? expr.validator.getSymbol(expr.base.id) : undefined;
		const base_types: readonly TYPE.Type[] = symbol instanceof SymbolSchemaFunc ? symbol.types : [this.throwIfVoid(expr.base, new TypeErrorInvalidOperation(expr))];
		if (base_types.some((t) => t.isBottomType)) {
			return TYPE.NOTHING;
		}
		if (
			expr.exprargsPosit.some((arg) => this.throwIfVoid(arg).isBottomType) ||
			expr.exprargsNamed.some((arg) => this.throwIfVoid(arg.val).isBottomType)
		) {
			return TYPE.NOTHING;
		}
		if (base_types.find((t) => t instanceof TYPE.Maybe || t instanceof TYPE.Result)) {
			throw new Error('Maybe/Result calls are not yet supported.');
		}
		assert.ok(base_types.length);

		if (base_types[0] !== TYPE.CLASS) {
			/* Throw and aggregate if any overload is not a function;
			otherwise, map to return types or errors as a result of type-checking. */
			const overload_calls: readonly [TYPE.Function, TYPE.Type | null | Error][] = xjs.Array.mapAggregated(base_types, (t) => {
				if (t instanceof TYPE.Function) {
					return [t, this.#typeFunctionCall(expr, t)];
				} else {
					throw new TypeErrorNotCallable(t, expr.base);
				}
			});
			const successes = overload_calls.filter(([_, result]) => !result || result instanceof TYPE.Type) as readonly [TYPE.Function, TYPE.Type | null][];
			const errors: readonly Error[] = overload_calls.map(([_, result]) => result).filter((result) => result instanceof Error);

			/* If multiple overloads match: if a maximally specific overload is found, return it; else throw a TypeErrorAmbiguousOverload.
			Else if there are multiple failures, throw a TypeErrorAmbiguousOverload containing the failures.
			Else return a single failure. */
			if (successes.length) {
				const maximally_specific: readonly [TYPE.Function, TYPE.Type | null][] = successes.filter(([ovl1]) => successes.every(([ovl2]) => ovl1 === ovl2 || ovl1.isMoreSpecificThan(ovl2)));
				if (maximally_specific.length === 1) {
					return maximally_specific[0][1];
				} else {
					throw new TypeErrorAmbiguousOverload(expr);
				}
			} else if (errors.length > 1) {
				throw new TypeErrorAmbiguousOverload(expr, new AggregateError(errors));
			} else {
				assert.ok(errors.length);
				throw errors[0];
			}
		}
		const constructor_schema:    ConstructorSchema = CLASS_API.get(expr.base.source as CallableClassName)!;
		const resolved_generic_args: TYPE.Type[]       = AST_TYPE.Call.checkGenericArgs(constructor_schema, expr.typeargs, expr);
		try {
			this.#checkFunctionArgs(expr, constructor_schema, resolved_generic_args);
		} catch (err) {
			if (err instanceof TypeErrorArgCount) {
				throw err;
			} else if (err instanceof AggregateError && err.errors.every((suberr) => suberr instanceof TypeErrorArgCount)) {
				// FIXME: should report whole AggregateError
				throw err.errors[0];
			}
			switch (expr.base.source as CallableClassName) {
				case IntrinsicName.LIST: {
					// If function overload checking failed, `arg` is either a tuple literal or an expression with a tuple type.
					const itemtype: TYPE.Type  = expr.typeargs[0].eval();
					const arg:      EXPR.Expression = expr.exprargsPosit[0];
					if (arg instanceof EXPR.Tuple) {
						xjs.Array.forEachAggregated(arg.children, (item) => typecheck_assign(this, item, itemtype, item));
					} else {
						const argtype: TYPE.Type = this.throwIfVoid(arg);
						if (argtype instanceof TYPE.Tuple) {
							const tupleitemtypes: TYPE.Type = argtype.itemTypes();
							if (!tupleitemtypes.isSubtypeOf(itemtype)) {
								throw new TypeErrorNotNarrow(tupleitemtypes, itemtype, expr.line_index, expr.col_index);
							}
						} else {
							throw err;
						}
					}
					break;
				}
				case IntrinsicName.DICT: {
					// If function overload checking failed, `arg` is either a tuple/record literal or an expression with a tuple/record type.
					const valuetype: TYPE.Type  = expr.typeargs[0].eval();
					const entrytype: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.SYM, valuetype]);
					const arg:       EXPR.Expression = expr.exprargsPosit[0];
					if (arg instanceof EXPR.Tuple) {
						xjs.Array.forEachAggregated(arg.children, (item) => typecheck_assign(this, item, entrytype, item));
					} else if (arg instanceof EXPR.Record) {
						xjs.Array.forEachAggregated(arg.children, (prop) => typecheck_assign(this, prop.val, valuetype, prop.val));
					} else {
						const argtype: TYPE.Type = this.throwIfVoid(arg);
						if (argtype instanceof TYPE.Tuple) {
							const tupleitemtypes: TYPE.Type = argtype.itemTypes();
							if (!tupleitemtypes.isSubtypeOf(entrytype)) {
								throw new TypeErrorNotNarrow(tupleitemtypes, entrytype, expr.line_index, expr.col_index);
							}
						} else if (argtype instanceof TYPE.Record) {
							const recordvaluetypes: TYPE.Type = argtype.valueTypes();
							if (!recordvaluetypes.isSubtypeOf(valuetype)) {
								throw new TypeErrorNotNarrow(recordvaluetypes, valuetype, expr.line_index, expr.col_index);
							}
						} else {
							throw err;
						}
					}
					break;
				}
				case IntrinsicName.SET: {
					// If function overload checking failed, `arg` is either a tuple literal or an expression with a tuple type.
					const eltype: TYPE.Type  = expr.typeargs[0].eval();
					const arg:    EXPR.Expression = expr.exprargsPosit[0];
					if (arg instanceof EXPR.Tuple) {
						xjs.Array.forEachAggregated(arg.children, (item) => typecheck_assign(this, item, eltype, item));
					} else {
						const argtype: TYPE.Type = this.throwIfVoid(arg);
						if (argtype instanceof TYPE.Tuple) {
							const tupleitemtypes: TYPE.Type = argtype.itemTypes();
							if (!tupleitemtypes.isSubtypeOf(eltype)) {
								throw new TypeErrorNotNarrow(tupleitemtypes, eltype, expr.line_index, expr.col_index);
							}
						} else {
							throw err;
						}
					}
					break;
				}
				case IntrinsicName.MAP: {
					// If function overload checking failed, `arg` is either a tuple literal or an expression with a tuple type.
					const anttype:   TYPE.Type  = expr.typeargs[0].eval();
					const contype:   TYPE.Type  = expr.typeargs[1]?.eval() ?? anttype;
					const entrytype: TYPE.Tuple = TYPE.Tuple.fromTypes([anttype, contype]);
					const arg:       EXPR.Expression = expr.exprargsPosit[0];
					if (arg instanceof EXPR.Tuple) {
						xjs.Array.forEachAggregated(arg.children, (item) => typecheck_assign(this, item, entrytype, item));
					} else {
						const argtype: TYPE.Type = this.throwIfVoid(arg);
						if (argtype instanceof TYPE.Tuple) {
							const tupleitemtypes: TYPE.Type = argtype.itemTypes();
							if (!tupleitemtypes.isSubtypeOf(entrytype)) {
								throw new TypeErrorNotNarrow(tupleitemtypes, entrytype, expr.line_index, expr.col_index);
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

	@memoizeExpressionType
	public override visitClaim(expr: EXPR.Claim): TYPE.Type | null {
		const computed_type: TYPE.Type = this.throwIfVoid(expr.operand);
		const claimed_type:  TYPE.Type = expr.claimed_type.eval();
		/* If the types are disjoint and neither of the types are the Bottom Type, throw an error. */
		if (!expr.force && computed_type.isDisjointWith(claimed_type) && !computed_type.isBottomType && !claimed_type.isBottomType) {
			/*
				`Conversion of type \`${computed_type}\` to type \`${claimed_type}\` may be a mistake
				because neither type sufficiently overlaps with the other.
				If this was intentional, convert the expression to \`anything\` first.`;
			*/
			throw new TypeErrorNotAssignable(expr.operand, claimed_type, expr);
		}
		return claimed_type;
	}

	@memoizeExpressionType
	public override visitOperationUnary(expr: EXPR.OperationUnary): TYPE.Type | null {
		const t: TYPE.Type = this.throwIfVoid(expr.operand, new TypeErrorInvalidOperation(expr));
		if (t.isBottomType) {
			return TYPE.NOTHING;
		}
		switch (expr.operator) {
			case Operator.UN_MAYBE: {
				return t instanceof TYPE.Maybe ? t.typearg : assert.fail(new TypeErrorInvalidOperation(expr));
			}
			case Operator.UN_RESULT: {
				return t instanceof TYPE.Result ? t.typeargSuccess : assert.fail(new TypeErrorInvalidOperation(expr));
			}
			case Operator.NOT: {
				return (
					t.isDefinitelyFalsy  ? TYPE.TRUE :
					t.isDefinitelyTruthy ? TYPE.FALSE :
					TYPE.BOOL
				);
			}
			case Operator.EMP: {
				return t.isDefinitelyFalsy ? TYPE.TRUE : TYPE.BOOL;
			}
			case Operator.NEG: {
				return t.isSubtypeOf(TYPE.INT.union(TYPE.FLOAT)) ? t : assert.fail(new TypeErrorInvalidOperation(expr));
			}
		}
	}

	@memoizeExpressionType
	public override visitOperationBinaryCast(expr: EXPR.OperationBinaryCast): TYPE.Type | null {
		const [t0, t1]: readonly TYPE.Type[] = expr.children.map((operand) => this.throwIfVoid(operand, new TypeErrorInvalidOperation(expr)));
		if (t0.isBottomType || t1.isBottomType) {
			return TYPE.NOTHING;
		}
		if (!t1.isSubtypeOf(TYPE.CLASS)) {
			throw new TypeErrorInvalidOperation(expr);
		}
		let cast_type: TYPE.Type | undefined;
		if (expr.operand1 instanceof EXPR.Variable) {
			const symbol = expr.validator.getSymbol(expr.operand1.id) as SymbolSchemaClass;
			cast_type = symbol.classSignature.supertype;
		}
		switch (expr.operator) {
			case Operator.IS: {
				return TYPE.BOOL;
			}
			case Operator.CAST: {
				if (cast_type && !cast_type.isSubtypeOf(t0)) {
					throw new TypeErrorNotNarrow(cast_type, t0, expr.line_index, expr.col_index);
				}
				return cast_type ?? t0;
			}
			case Operator.CAST_MAYBE: {
				if (cast_type && !cast_type.isSubtypeOf(t0)) {
					throw new TypeErrorNotNarrow(cast_type, t0, expr.line_index, expr.col_index);
				}
				return new TYPE.Maybe(cast_type ?? t0);
			}
		}
	}

	@memoizeExpressionType
	public override visitOperationBinaryArithmetic(expr: EXPR.OperationBinaryArithmetic): TYPE.Type | null {
		const [t0, t1]: readonly TYPE.Type[] = expr.children.map((operand) => this.throwIfVoid(operand, new TypeErrorInvalidOperation(expr)));
		if (t0.isBottomType || t1.isBottomType) {
			return TYPE.NOTHING;
		}
		return (
			bothInts  (t0, t1) ? TYPE.INT :
			bothNats  (t0, t1) ? TYPE.NAT :
			bothFloats(t0, t1) ? TYPE.FLOAT :
			assert.fail(new TypeErrorInvalidOperation(expr))
		);
	}

	@memoizeExpressionType
	public override visitOperationBinaryComparative(expr: EXPR.OperationBinaryComparative): TYPE.Type | null {
		const [t0, t1]: readonly TYPE.Type[] = expr.children.map((operand) => this.throwIfVoid(operand, new TypeErrorInvalidOperation(expr)));
		if (t0.isBottomType || t1.isBottomType) {
			return TYPE.NOTHING;
		}
		return (
			bothNumbers(t0, t1) ? TYPE.BOOL :
			assert.fail(new TypeErrorInvalidOperation(expr))
		);
	}

	@memoizeExpressionType
	public override visitOperationBinaryEquality(expr: EXPR.OperationBinaryEquality): TYPE.Type | null {
		const [t0, t1]: readonly TYPE.Type[] = expr.children.map((operand) => this.throwIfVoid(operand, new TypeErrorInvalidOperation(expr)));
		if (t0.isBottomType || t1.isBottomType) {
			return TYPE.NOTHING;
		}
		const DISJOINT_TYPES = t0.isDisjointWith(t1);
		switch (expr.operator) {
			case Operator.ID: {
				/*
				 * Identity:
				 * - If      the types of `a` and `b` are disjoint, then `a === b` will always evaluate to false.
				 * - Else if the types of `a` and `b` intersect,    then `a === b` could evaluate to true.
				 */
				return DISJOINT_TYPES ? TYPE.FALSE : TYPE.BOOL;
			}
			case Operator.EQ: {
				/*
				 * Equality:
				 * - If the types of `a` and `b` are disjoint,
				 * 	*and* any of `a` or `b` is disjoint with the Number type (it cannot contain numbers),
				 * 	then `a == b` will always evaluate to false.
				 * - Else if the types of `a` and `b` intersect,
				 * 	*or* both `a` and `b` intersect with the Number type (they both might contain numbers),
				 * 	then `a == b` could evaluate to true.
				 */
				return DISJOINT_TYPES && [t0, t1].some((t) => t.isDisjointWith(TYPE.NUMBER)) ? TYPE.FALSE : TYPE.BOOL;
			}
		}
	}

	@memoizeExpressionType
	public override visitOperationBinaryLogical(expr: EXPR.OperationBinaryLogical): TYPE.Type | null {
		const t0: TYPE.Type = this.throwIfVoid(expr.children[0], new TypeErrorInvalidOperation(expr)); // a void expression cannot be tested for truthiness
		const t1: TYPE.Type | null = this.visit(expr.children[1]);
		if (t0.isBottomType) {
			return TYPE.NOTHING;
		}
		if (!t1) {
			return null; // a void operand consumes other operands
		}
		switch (expr.operator) {
			case Operator.AND: {
				return (
					t0.isDefinitelyFalsy  ? t0 :
					t0.isDefinitelyTruthy ? t1 :
					t0.falsySide.union(t1)
				);
			}
			case Operator.OR: {
				return (
					t0.isDefinitelyFalsy  ? t1 :
					t0.isDefinitelyTruthy ? t0 :
					t0.truthySide.union(t1)
				);
			}
		}
	}

	@memoizeExpressionType
	public override visitOperationTernary(expr: EXPR.OperationTernary): TYPE.Type | null {
		const t0: TYPE.Type = this.throwIfVoid(expr.children[0], new TypeErrorInvalidOperation(expr));
		const [t1, t2]: readonly (TYPE.Type | null)[] = expr.children.slice(1).map((operand) => this.visit(operand));
		if (t0.isBottomType) {
			return TYPE.NOTHING;
		}
		if (!t0.isSubtypeOf(TYPE.BOOL)) {
			throw new TypeErrorInvalidOperation(expr);
		}
		return (
			!t1 || !t2            ? null :
			t0.equals(TYPE.FALSE) ? t2 :
			t0.equals(TYPE.TRUE)  ? t1 :
			t1.union(t2)
		);
	}

	@memoizeExpressionType
	public override visitSwitch(expr: EXPR.Switch): TYPE.Type | null {
		const t0: TYPE.Type = this.throwIfVoid(expr.value, new TypeErrorInvalidOperation(expr));
		const tns: readonly (TYPE.Type | null)[] = [...expr.cases.map((kase) => {
			kase.antecedents.forEach((ant) => { this.throwIfVoid(ant); });
			return this.visit(kase.consequent);
		}), this.visit(expr.default_)];
		if (t0.isBottomType) {
			return TYPE.NOTHING;
		}
		return tns.some((t) => !t) ? null : TYPE.Union.all(...tns as readonly TYPE.Type[]);
	}


	@memoizeExpressionType
	public override visitFunction(expr: EXPR.Function): TYPE.Type | null {
		return this.visitFunctionlike(expr);
	}

	public override defaultVisit(_expr: EXPR.Expression): TYPE.Type | null {
		return TYPE.ANYTHING;
	}

	public throwIfVoid(expr: EXPR.Expression, err?: CplTypeError): TYPE.Type {
		const t: TYPE.Type | null = this.visit(expr);
		if (!t) {
			throw err ?? new CplTypeError('Expression of type `void` is not a value.'); // TODO: new class of CplTypeError
		}
		return t;
	}

	public visitFunctionlike(node: Functionlike): TYPE.Function {
		return new TYPE.Function(
			new TYPE.Tuple(node.parameters.filter((param) => !param.named).map((param) => ({
				type:     param.typenode.eval(),
				optional: param.optional,
			}))),
			new TYPE.Record(new Map<bigint, EntryType>(node.parameters.filter((param) => param.named).map((param) => [
				param.labelId!,
				{
					type:     param.typenode.eval(),
					optional: param.optional,
				},
			]))),
			node.returnType?.eval(),
		);
	}

	#typeFunctionCall(call: EXPR.Call, t: TYPE.Function): TYPE.Type | null | Error {
		const expected_function = {
			min: t.typeargParamsPosit.minCount,
			max: BigInt(t.typeargParamsPosit.typeargs.length),
		} as const;
		const actual_function: bigint = BigInt(call.exprargsPosit.length);
		const too_few_err = new TypeErrorArgCount(actual_function, expected_function.min, false, call);
		if (actual_function < expected_function.min) {
			return too_few_err;
		} else if (actual_function > expected_function.max) {
			return new TypeErrorArgCount(actual_function, expected_function.max, false, call);
		}
		try {
			EXPR.Tuple.assignExprsToTupleType(this, call.exprargsPosit, t.typeargParamsPosit);
			EXPR.Record.assignPropsToRecordType(this, call.exprargsNamed, t.typeargParamsNamed, too_few_err);
		} catch (err) {
			if (only_errors_of_type(err as Error, [CplTypeError])) {
				return err as Error;
			} else {
				throw err;
			}
		}
		return t.typeargReturn ?? null;
	}

	/**
	 * Type-checks assignment of function arguments to a constructor call.
	 * @param constructor_schema    the name of the class constructor’s schema
	 * @param resolved_generic_args the resolved type arguments, returned by {@link AST_TYPE.Call.checkGenericArgs}
	 */
	#checkFunctionArgs(call: EXPR.Call, constructor_schema: ConstructorSchema, resolved_generic_args: readonly TYPE.Type[]): void {
		if (!constructor_schema.overloads.length) {
			throw new TypeErrorNotCallable(
				this.visit(call.base)!,
				call.base,
			);
		}
		xjs.Array.forEither(constructor_schema.overloads, (func_params) => {
			/* Argument Counting. Throws if the number of given args does not match the number of expected parameters. */
			const expected_function = {
				min: BigInt(func_params.positional?.filter((param) => !param.optional).length ?? 0),
				max: BigInt(func_params.positional?.length ?? 0),
			} as const;
			const actual_function: bigint = BigInt(call.exprargsPosit.length);
			// TODO: throw AggregateError if both
			if (actual_function < expected_function.min) {
				throw new TypeErrorArgCount(actual_function, expected_function.min, false, call);
			}
			if (actual_function > expected_function.max) {
				throw new TypeErrorArgCount(actual_function, expected_function.max, false, call);
			}

			/* Argument Typing. Handles optionality and default values. Also checks if each argument matches the constraints given. */
			func_params.positional?.forEach((param, i) => {
				const argnode: EXPR.Expression | undefined = call.exprargsPosit.at(i);
				if (argnode) {
					typecheck_assign(this, argnode, param.type.call(null, resolved_generic_args), call);
				} else {
					assert.ok(param.optional); // we can assert this due to argument counting above
				}
			});
			func_params.named?.forEach((param, id) => {
				const argnode: Property | undefined = call.exprargsNamed.find((prop) => prop.key.id === id);
				if (argnode) {
					typecheck_assign(this, argnode.val, param.type.call(null, resolved_generic_args), call);
				} else if (!param.optional) {
					throw new TypeError(`Missing argument for requierd named parameter ${id}.`); // TODO: new class of CplTypeError
				}
			});
		});
	}
}
