import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNotAssignable,
	TypeErrorNotCallable,
	TypeErrorArgCount,
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
	type CallableClassName,
	type ConstructorSchema,
	CLASS_API,
	get_entry_info,
} from '../utils-private.ts';
import {CompletionKind} from '../CompletionKind.ts';
import {typecheck_assign} from '../AstNode.ts';
import type {Functionlike} from '../Functionlike.ts';
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
	method:   (this: ExprVisitorType, arg: Param) => TYPE.Type,
	_context: ClassMethodDecoratorContext<ExprVisitorType, typeof method>,
): typeof method {
	return function (arg) {
		arg.type = method.bind(this, arg);
		return arg.type;
	};
}



export class ExprVisitorType extends EXPR.ExprVisitor<TYPE.Type> {
	readonly #astNodeVisitorCompletion = new AstNodeVisitorCompletion();


	@memoizeExpressionType
	public override visitConstant(expr: EXPR.Constant): TYPE.Type {
		return expr.interpreterValue.toType();
	}

	@memoizeExpressionType
	public override visitTemplate(_expr: EXPR.Template): TYPE.Type {
		return TYPE.STR;
	}

	@memoizeExpressionType
	public override visitVariable(expr: EXPR.Variable): TYPE.Type {
		assert.ok(expr.validator.hasSymbol(expr.id), `Expected ${expr.source} (${expr.id}) to be in the symbol table.`);
		const symbol: SymbolSchema = expr.validator.getSymbol(expr.id)!;
		if (symbol instanceof SymbolSchemaVar) {
			return symbol.isUninitialized ? new TYPE.Maybe(symbol.type) : symbol.type;
		} else if (symbol instanceof SymbolSchemaFunc) {
			return TYPE.Intersection.all(...symbol.types);
		} else {
			assert_instanceof(symbol, SymbolSchemaClass);
			return TYPE.CLASS;
		}
	}

	@memoizeExpressionType
	public override visitTuple(expr: EXPR.Tuple): TYPE.Type {
		if (expr.children.some((c) => this.visit(c).isBottomType)) {
			return TYPE.NOTHING;
		}
		return TYPE.Tuple.fromTypes(expr.children.map((c) => this.visit(c)));
	}

	@memoizeExpressionType
	public override visitRecord(expr: EXPR.Record): TYPE.Type {
		if (expr.children.some((c) => this.visit(c.val).isBottomType)) {
			return TYPE.NOTHING;
		}
		return TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>(expr.children.map((c) => [
			c.key.id,
			this.visit(c.val),
		])));
	}

	@memoizeExpressionType
	public override visitList(expr: EXPR.List): TYPE.Type {
		if (expr.children.some((c) => this.visit(c).isBottomType)) {
			return TYPE.NOTHING;
		}
		return new TYPE.List(
			TYPE.Union.all(...expr.children.map((c) => this.visit(c))),
			true,
		);
	}

	@memoizeExpressionType
	public override visitDict(expr: EXPR.Dict): TYPE.Type {
		if (expr.children.some((c) => this.visit(c.val).isBottomType)) {
			return TYPE.NOTHING;
		}
		return new TYPE.Dict(
			TYPE.Union.all(...expr.children.map((c) => this.visit(c.val))),
			true,
		);
	}

	@memoizeExpressionType
	public override visitSet(expr: EXPR.Set): TYPE.Type {
		if (expr.children.some((c) => this.visit(c).isBottomType)) {
			return TYPE.NOTHING;
		}
		return new TYPE.Set(
			TYPE.Union.all(...expr.children.map((c) => this.visit(c))),
			true,
		);
	}

	@memoizeExpressionType
	public override visitMap(expr: EXPR.Map): TYPE.Type {
		if (expr.children.some((c) => this.visit(c.antecedents[0]).isBottomType || this.visit(c.consequent).isBottomType)) {
			return TYPE.NOTHING;
		}
		return new TYPE.Map(
			TYPE.Union.all(...expr.children.map((c) => this.visit(c.antecedents[0]))),
			TYPE.Union.all(...expr.children.map((c) => this.visit(c.consequent))),
			true,
		);
	}

	@memoizeExpressionType
	public override visitExprBlock(expr: EXPR.ExpressionBlock): TYPE.Type {
		if (this.#astNodeVisitorCompletion.visit(expr.block) !== CompletionKind.NORMAL) {
			return TYPE.NOTHING;
		}
		assert.ok(expr.block.children.length, 'Expected Block to contain at least 1 statement.');
		const last_stmt: STMT.Statement = expr.block.children.at(-1)!;
		/* TODO: For now, all block-expressions must have a type, thus must have a determinant.
		but after #46 (void functions), block-expressions don’t need a determinant and thus may have a “void” type.
		In those cases, instead of throwing errors here, return `null`. */
		if (!(last_stmt instanceof STMT.StatementExpression)) {
			throw new Error('The last statement of a block-expression must be an expression-statement.');
		}
		const last_expr: EXPR.Expression | undefined = last_stmt.expr;
		if (!last_expr) {
			throw new Error('The determining expression-statement of a block-expression must be nonempty.');
		}
		return this.visit(last_expr);
	}

	@memoizeExpressionType
	public override visitAccess(expr: EXPR.Access): TYPE.Type {
		const base_type: TYPE.Type = this.visit(expr.base);
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
	public override visitCall(expr: EXPR.Call): TYPE.Type {
		if (!(expr.base instanceof EXPR.Variable)) {
			throw new TypeErrorNotCallable(this.visit(expr.base), expr.base);
		}
		if (expr.exprargs.some((arg) => this.visit(arg).isBottomType)) {
			return TYPE.NOTHING;
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
					const arg:      EXPR.Expression = expr.exprargs[0];
					if (arg instanceof EXPR.Tuple) {
						xjs.Array.forEachAggregated(arg.children, (item) => typecheck_assign(this, item, itemtype, item));
					} else {
						const argtype: TYPE.Type = this.visit(arg);
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
					const arg:       EXPR.Expression = expr.exprargs[0];
					if (arg instanceof EXPR.Tuple) {
						xjs.Array.forEachAggregated(arg.children, (item) => typecheck_assign(this, item, entrytype, item));
					} else if (arg instanceof EXPR.Record) {
						xjs.Array.forEachAggregated(arg.children, (prop) => typecheck_assign(this, prop.val, valuetype, prop.val));
					} else {
						const argtype: TYPE.Type = this.visit(arg);
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
					const arg:    EXPR.Expression = expr.exprargs[0];
					if (arg instanceof EXPR.Tuple) {
						xjs.Array.forEachAggregated(arg.children, (item) => typecheck_assign(this, item, eltype, item));
					} else {
						const argtype: TYPE.Type = this.visit(arg);
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
					const arg:       EXPR.Expression = expr.exprargs[0];
					if (arg instanceof EXPR.Tuple) {
						xjs.Array.forEachAggregated(arg.children, (item) => typecheck_assign(this, item, entrytype, item));
					} else {
						const argtype: TYPE.Type = this.visit(arg);
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
	public override visitClaim(expr: EXPR.Claim): TYPE.Type {
		const computed_type: TYPE.Type = this.visit(expr.operand);
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
	public override visitOperationUnary(expr: EXPR.OperationUnary): TYPE.Type {
		const t: TYPE.Type = this.visit(expr.operand);
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
	public override visitOperationBinaryCast(expr: EXPR.OperationBinaryCast): TYPE.Type {
		const [t0, t1]: readonly TYPE.Type[] = expr.children.map((operand) => this.visit(operand));
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
	public override visitOperationBinaryArithmetic(expr: EXPR.OperationBinaryArithmetic): TYPE.Type {
		const [t0, t1]: readonly TYPE.Type[] = expr.children.map((operand) => this.visit(operand));
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
	public override visitOperationBinaryComparative(expr: EXPR.OperationBinaryComparative): TYPE.Type {
		const [t0, t1]: readonly TYPE.Type[] = expr.children.map((operand) => this.visit(operand));
		if (t0.isBottomType || t1.isBottomType) {
			return TYPE.NOTHING;
		}
		return (
			bothNumbers(t0, t1) ? TYPE.BOOL :
			assert.fail(new TypeErrorInvalidOperation(expr))
		);
	}

	@memoizeExpressionType
	public override visitOperationBinaryEquality(expr: EXPR.OperationBinaryEquality): TYPE.Type {
		const [t0, t1]: readonly TYPE.Type[] = expr.children.map((operand) => this.visit(operand));
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
	public override visitOperationBinaryLogical(expr: EXPR.OperationBinaryLogical): TYPE.Type {
		const [t0, t1]: readonly TYPE.Type[] = expr.children.map((operand) => this.visit(operand));
		if (t0.isBottomType) {
			return TYPE.NOTHING;
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
	public override visitOperationTernary(expr: EXPR.OperationTernary): TYPE.Type {
		const [t0, t1, t2]: readonly TYPE.Type[] = expr.children.map((operand) => this.visit(operand));
		if (!t0.isSubtypeOf(TYPE.BOOL)) {
			throw new TypeErrorInvalidOperation(expr);
		}
		return (
			t0.isBottomType       ? TYPE.NOTHING :
			t0.equals(TYPE.FALSE) ? t2 : // If `typeof a` is `false`, then `typeof (if a then b else c)` is `typeof c`.
			t0.equals(TYPE.TRUE)  ? t1 : // If `typeof a` is `true`,  then `typeof (if a then b else c)` is `typeof b`.
			t1.union(t2)
		);
	}

	@memoizeExpressionType
	public override visitSwitch(expr: EXPR.Switch): TYPE.Type {
		return this.visit(expr.value).isBottomType
			? TYPE.NOTHING
			: TYPE.Union.all(...expr.cases.map((kase) => {
				kase.antecedents.forEach((ant) => { this.visit(ant); }); // rethrow any type-errors
				return this.visit(kase.consequent);
			}), this.visit(expr.default_));
	}


	@memoizeExpressionType
	public override visitFunction(expr: EXPR.Function): TYPE.Type {
		return this.visitFunctionlike(expr);
	}

	public override defaultVisit(_expr: EXPR.Expression): TYPE.Type {
		return TYPE.ANYTHING;
	}

	public visitFunctionlike(node: Functionlike): TYPE.Type {
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

	/**
	 * Type-checks assignment of function arguments to a constructor call.
	 * @param constructor_schema    the name of the class constructor’s schema
	 * @param resolved_generic_args the resolved type arguments, returned by {@link AST_TYPE.Call.checkGenericArgs}
	 */
	#checkFunctionArgs(call: EXPR.Call, constructor_schema: ConstructorSchema, resolved_generic_args: readonly TYPE.Type[]): void {
		if (!constructor_schema.overloads.length) {
			throw new TypeErrorNotCallable(
				call.base.source === IntrinsicName.MAYBE ? new TYPE.Maybe(resolved_generic_args[0]) :
				call.base.source === IntrinsicName.RESULT ? new TYPE.Result(resolved_generic_args[0], resolved_generic_args[1]) :
				this.visit(call.base),
				call.base,
			);
		}
		xjs.Array.forEither(constructor_schema.overloads, (func_params) => {
			/* Argument Counting. Throws if the number of given args does not match the number of expected parameters. */
			const expected_function = {
				min: BigInt(func_params.filter((param) => !param.optional).length),
				max: BigInt(func_params.length),
			} as const;
			const actual_function: bigint = BigInt(call.exprargs.length);
			// TODO: throw AggregateError if both
			if (actual_function < expected_function.min) {
				throw new TypeErrorArgCount(actual_function, expected_function.min, false, call);
			}
			if (actual_function > expected_function.max) {
				throw new TypeErrorArgCount(actual_function, expected_function.max, false, call);
			}

			/* Argument Typing. Handles optionality and default values. Also checks if each argument matches the constraints given. */
			func_params.forEach((param, i) => {
				if (!call.exprargs.at(i)) {
					assert.ok(param.optional); // we can assert this due to argument counting above
				}
				const argnode: EXPR.Expression | undefined = call.exprargs.at(i);
				if (argnode) {
					typecheck_assign(this, argnode, param.type.call(null, resolved_generic_args), call);
				}
			});
		});
	}
}
