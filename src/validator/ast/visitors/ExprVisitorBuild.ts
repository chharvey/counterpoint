import * as assert from 'node:assert';
import {
	type Temp,
	type Builder,
	OP,
} from '../../../index.ts';
import {assert_instanceof} from '../../../lib/index.ts';
import {
	VALUE,
	TYPE,
} from '../../../typer/index.ts';
import {CoreLibName} from '../../../parser/index.ts';
import {
	SymbolSchemaVar,
	type SymbolSchemaClass,
} from '../../index.ts';
import {Operator} from '../../Operator.ts';
import type {CallableClassName} from '../utils-private.ts';
import {Index} from '../Index-.ts';
import {Key} from '../Key.ts';
import * as EXPR from '../expression/index.ts';
import type * as STMT from '../statement/index.ts';
import {
	bothInts,
	bothNats,
	bothFloats,
} from './utils.ts';
import {memoizePerNode} from './decorators.ts';
import {AstNodeVisitorBuild} from './AstNodeVisitorBuild.ts';



export class ExprVisitorBuild extends EXPR.ExprVisitor<OP.Value> {
	#nodeVisitorBuild?: AstNodeVisitorBuild;


	public constructor(private readonly builder: Builder) {
		super();
	}


	@memoizePerNode
	public override visitConstant(expr: EXPR.Constant): OP.Value {
		return new OP.Const(expr.interpreterValue);
	}

	@memoizePerNode
	public override visitTemplate(expr: EXPR.Template): OP.Value {
		return new OP.Template(expr.children.map((c) => {
			const build: OP.ValueTac = this.visit(c).asTac(this.builder);
			return c.type.isSubtypeOf(TYPE.STR)
				? build
				: new OP.Unop(OP.OpCode.STR_FROM, build, TYPE.STR).asTac(this.builder);
		}));
	}

	@memoizePerNode
	public override visitVariable(expr: EXPR.Variable): OP.Value {
		const symbol = expr.validator.getSymbol(expr.id) as SymbolSchemaVar | SymbolSchemaClass;
		return new OP.Get(symbol, symbol instanceof SymbolSchemaVar ? symbol.irType : TYPE.CLASS);
	}

	@memoizePerNode
	public override visitTuple(expr: EXPR.Tuple): OP.Value {
		return new OP.CollectionLinearNew(OP.TypeName.TUPLE, expr.children.map((c) => this.visit(c).asTac(this.builder)), expr.type);
	}

	@memoizePerNode
	public override visitRecord(expr: EXPR.Record): OP.Value {
		return new OP.RecordNew(new Map(expr.children.map((c) => ([
			c.key.id,
			{keysrc: c.key.source, value: this.visit(c.val).asTac(this.builder)},
		]))), expr.type);
	}

	@memoizePerNode
	public override visitList(expr: EXPR.List): OP.Value {
		return new OP.CollectionLinearNew(OP.TypeName.LIST, expr.children.map((c) => this.visit(c).asTac(this.builder)), expr.type);
	}

	@memoizePerNode
	public override visitDict(expr: EXPR.Dict): OP.Value {
		return new OP.DictNew(new Map(expr.children.map((c) => [
			new VALUE.Symbol(c.key.id, c.key.source),
			this.visit(c.val).asTac(this.builder),
		])), expr.type);
	}

	@memoizePerNode
	public override visitSet(expr: EXPR.Set): OP.Value {
		return new OP.CollectionLinearNew(OP.TypeName.SET, expr.children.map((c) => this.visit(c).asTac(this.builder)), expr.type);
	}

	@memoizePerNode
	public override visitMap(expr: EXPR.Map): OP.Value {
		return new OP.MapNew(new Map(expr.children.map((c) => [
			this.visit(c.antecedents[0]) .asTac(this.builder),
			this.visit(c.consequent)     .asTac(this.builder),
		])), expr.type);
	}

	@memoizePerNode
	public override visitExprBlock(expr: EXPR.ExpressionBlock): OP.Value {
		this.#nodeVisitorBuild ??= new AstNodeVisitorBuild(this.builder);
		expr.block.children.slice(0, -1).forEach((stmt) => this.#nodeVisitorBuild!.visit(stmt));
		return this.visit((expr.block.children.at(-1) as STMT.StatementExpression).expr!);
	}

	@memoizePerNode
	public override visitAccess(expr: EXPR.Access): OP.Value {
		const typ:        TYPE.Type   = expr.type;
		const base_value: OP.ValueTac = this.visit(expr.base).asTac(this.builder);

		if (expr.kind === Operator.DOT_MAYBE) {
			assert_instanceof(typ, TYPE.Maybe);
			return OP.conditional_expression(
				this.builder,
				typ,
				() => new OP.Unop(OP.OpCode.NONE_IS, base_value, TYPE.BOOL),
				() => new OP.MaybeNew(typ.typearg),
				() => new OP.MaybeNew(typ.typearg, this.#buildUnwrappedGet(
					expr,
					// TODO: `base_value.type` should always be `Maybe` once expression access is removed. put the assertion underneath `typ`
					base_value.type instanceof TYPE.Maybe ? new OP.Unop(OP.OpCode.MAYBE_UNWRAP, base_value, base_value.type.typearg).asTac(this.builder) : base_value,
					typ.typearg,
				).asTac(this.builder)),
			);
		} else if (expr.kind === Operator.DOT_RESULT) {
			assert_instanceof(typ,             TYPE.Result);
			assert_instanceof(base_value.type, TYPE.Result);
			return OP.conditional_expression(
				this.builder,
				typ,
				() => new OP.Unop(OP.OpCode.FAIL_IS, base_value, TYPE.BOOL),
				() => new OP.ResultNew(false, typ.typeargSuccess, typ.typeargFailure, new OP.Unop(OP.OpCode.RESULT_EXTRACT, base_value, (base_value.type as TYPE.Result).typeargFailure).asTac(this.builder)),
				() => new OP.ResultNew(true,  typ.typeargSuccess, typ.typeargFailure, this.#buildUnwrappedGet(
					expr,
					new OP.Unop(OP.OpCode.RESULT_UNWRAP, base_value, (base_value.type as TYPE.Result).typeargSuccess).asTac(this.builder),
					typ.typeargSuccess,
				).asTac(this.builder)),
			);
		}
		return this.#buildUnwrappedGet(expr, base_value, typ);
	}

	@memoizePerNode
	public override visitCall(expr: EXPR.Call): OP.Value {
		/*
		 * Note: Eventually, calls will be dynamic; all we’d need to return is a new `OP.Call` object.
		 * But until we get functions and classes, statically build the function calls.
		 */
		if (false) { // eslint-disable-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
			return new OP.Call(
				this.visit(expr.base).asTac(this.builder),
				expr.exprargs.map((arg) => this.visit(arg).asTac(this.builder)),
				expr.type,
			);
		}

		const base_source = expr.base.source as CallableClassName;
		switch (base_source) {
			case CoreLibName.BOOLEAN:
			case CoreLibName.INTEGER:
			case CoreLibName.NATURAL:
			case CoreLibName.FLOAT:
			case CoreLibName.STRING: {
				return new OP.Unop(new Map<CoreLibName, OP.OpCodeUn>([
					[CoreLibName.BOOLEAN, OP.OpCode.BOOL_FROM],
					[CoreLibName.INTEGER, OP.OpCode.INT_FROM],
					[CoreLibName.NATURAL, OP.OpCode.NAT_FROM],
					[CoreLibName.FLOAT,   OP.OpCode.FLOAT_FROM],
					[CoreLibName.STRING,  OP.OpCode.STR_FROM],
				]).get(base_source)!, this.visit(expr.exprargs[0]).asTac(this.builder), expr.type);
			}
			case CoreLibName.LIST:
			case CoreLibName.DICT:
			case CoreLibName.SET:
			case CoreLibName.MAP: {
				const [name, ctor] = new Map<CoreLibName, [OP.CollectionDynamicName, () => OP.Value]>([
					[CoreLibName.LIST, [OP.TypeName.LIST, () => new OP.CollectionLinearNew(OP.TypeName.LIST, [], expr.type)]],
					[CoreLibName.SET,  [OP.TypeName.SET,  () => new OP.CollectionLinearNew(OP.TypeName.SET,  [], expr.type)]],
					[CoreLibName.DICT, [OP.TypeName.DICT, () => new OP.DictNew (new Map(), expr.type)]],
					[CoreLibName.MAP,  [OP.TypeName.MAP,  () => new OP.MapNew  (new Map(), expr.type)]],
				]).get(base_source)!;
				const new_obj: OP.Value = ctor();
				if (!expr.exprargs.length) {
					return new_obj;
				}
				const dest: OP.ValueTac = new_obj.asTac(this.builder);
				this.builder.pushInstruction(new OP.CollectionDynamicCopy(name, dest, this.visit(expr.exprargs[0]).asTac(this.builder)));
				return dest;
			}
			case CoreLibName.EXCEPTION: {
				return new OP.ExcpNew(
					this.visit(expr.exprargs[0]).asTac(this.builder),
					expr.exprargs[1] ? this.visit(expr.exprargs[1]).asTac(this.builder) : undefined,
				);
			}
			case CoreLibName.NONE:
			case CoreLibName.SOME: {
				return new OP.MaybeNew(expr.typeargs[0].eval(), expr.exprargs[0] ? this.visit(expr.exprargs[0]).asTac(this.builder) : undefined);
			}
			case CoreLibName.FAIL:
			case CoreLibName.OK: {
				return new OP.ResultNew(
					base_source === CoreLibName.OK,
					expr.typeargs[0].eval(),
					expr.typeargs[1]?.eval() ?? TYPE.EXCP,
					this.visit(expr.exprargs[0]).asTac(this.builder),
				);
			}
		}
	}

	@memoizePerNode
	public override visitClaim(expr: EXPR.Claim): OP.Value {
		return this.visit(expr.operand);
	}

	@memoizePerNode
	public override visitOperationUnary(expr: EXPR.OperationUnary): OP.Value {
		return new OP.Unop(new Map<Operator, OP.OpCodeUn>([
			[Operator.UN_MAYBE,  OP.OpCode.MAYBE_UNWRAP],
			[Operator.UN_RESULT, OP.OpCode.RESULT_UNWRAP],
			[Operator.NOT,       OP.OpCode.NOT],
			[Operator.EMP,       OP.OpCode.EMP],
			[Operator.NEG,       OP.OpCode.NEG],
		]).get(expr.operator)!, this.visit(expr.operand).asTac(this.builder), expr.type);
	}

	@memoizePerNode
	public override visitOperationBinaryCast(expr: EXPR.OperationBinaryCast): OP.Value {
		const [v0, v1] = [this.visit(expr.operand0).asTac(this.builder), this.visit(expr.operand1).asTac(this.builder)];
		const is_instance = (): OP.Value => new OP.Binop(OP.OpCode.IS, v0, v1, TYPE.BOOL);
		switch (expr.operator) {
			case Operator.IS: {
				return is_instance();
			}
			case Operator.CAST: {
				return OP.conditional_expression(
					this.builder,
					expr.type.union(v0.type), // allow invalid type-casting; in that case condition will be false anyway
					is_instance,
					() => v0,
					() => new OP.Trap(),
				);
			}
			case Operator.CAST_MAYBE: {
				const expr_type = expr.type as TYPE.Maybe;
				return OP.conditional_expression(
					this.builder,
					expr_type,
					is_instance,
					() => new OP.MaybeNew(expr_type.typearg, v0),
					() => new OP.MaybeNew(expr_type.typearg),
				);
			}
		}
	}

	@memoizePerNode
	public override visitOperationBinaryArithmetic(expr: EXPR.OperationBinaryArithmetic): OP.Value {
		const typ: TYPE.Type = expr.type;
		const [t0, t1] = [expr.operand0.type,                            expr.operand1.type];
		const [v0, v1] = [this.visit(expr.operand0).asTac(this.builder), this.visit(expr.operand1).asTac(this.builder)];
		return (
			bothInts(t0, t1) ? new OP.Binop(new Map<Operator, OP.OpCodeBin>([
				[Operator.EXP, OP.OpCode.INT_EXP],
				[Operator.MUL, OP.OpCode.INT_MUL],
				[Operator.DIV, OP.OpCode.INT_DIV],
				[Operator.ADD, OP.OpCode.INT_ADD],
				[Operator.SUB, OP.OpCode.INT_SUB],
			]).get(expr.operator)!, v0, v1, typ) :
			bothNats(t0, t1) ? new OP.Binop(new Map<Operator, OP.OpCodeBin>([
				[Operator.EXP, OP.OpCode.NAT_EXP],
				[Operator.MUL, OP.OpCode.NAT_MUL],
				[Operator.DIV, OP.OpCode.NAT_DIV],
				[Operator.ADD, OP.OpCode.NAT_ADD],
				[Operator.SUB, OP.OpCode.NAT_SUB],
			]).get(expr.operator)!, v0, v1, typ) :
			(assert.ok(bothFloats(t0, t1)), new OP.Binop(new Map<Operator, OP.OpCodeBin>([
				[Operator.EXP, OP.OpCode.FLOAT_EXP],
				[Operator.MUL, OP.OpCode.FLOAT_MUL],
				[Operator.DIV, OP.OpCode.FLOAT_DIV],
				[Operator.ADD, OP.OpCode.FLOAT_ADD],
				[Operator.SUB, OP.OpCode.FLOAT_SUB],
			]).get(expr.operator)!, v0, v1, typ))
		);
	}

	@memoizePerNode
	public override visitOperationBinaryComparative(expr: EXPR.OperationBinaryComparative): OP.Value {
		return new OP.Binop(new Map<Operator, OP.OpCodeBin>([
			[Operator.LT, OP.OpCode.LT],
			[Operator.GT, OP.OpCode.GT],
			[Operator.LE, OP.OpCode.LE],
			[Operator.GE, OP.OpCode.GE],
		]).get(expr.operator)!, this.visit(expr.operand0).asTac(this.builder), this.visit(expr.operand1).asTac(this.builder), expr.type);
	}

	@memoizePerNode
	public override visitOperationBinaryEquality(expr: EXPR.OperationBinaryEquality): OP.Value {
		return new OP.Binop(new Map<Operator, OP.OpCodeBin>([
			[Operator.ID, OP.OpCode.ID],
			[Operator.EQ, OP.OpCode.EQ],
		]).get(expr.operator)!, this.visit(expr.operand0).asTac(this.builder), this.visit(expr.operand1).asTac(this.builder), expr.type);
	}

	@memoizePerNode
	public override visitOperationBinaryLogical(expr: EXPR.OperationBinaryLogical): OP.Value {
		/*
		 * `‹v0› && ‹v1›` desugars to:
		 * ```
		 * val left = ‹v0›;
		 * if !!left then ‹v1› else left
		 * ```
		 *
		 * `‹v0› || ‹v1›` desugars to:
		 * ```
		 * val left = ‹v0›;
		 * if !!left then left else ‹v1›
		 * ```
		 */
		const left: OP.ValueTac = this.visit(expr.operand0).asTac(this.builder);

		// Assume `Operator.AND` first, then switch if `Operator.OR`.
		let conseq = (): OP.Value => this.visit(expr.operand1);
		let altern = (): OP.Value => left;
		if (expr.operator === Operator.OR) {
			[conseq, altern] = [altern, conseq];
		}

		return OP.conditional_expression(
			this.builder,
			expr.operand0.type.union(expr.operand1.type), // TODO: turn typeCheck optimization off and just use `expr.type` here
			() => new OP.Unop(OP.OpCode.BOOL_FROM, left, TYPE.BOOL),
			conseq,
			altern,
		);
	}

	@memoizePerNode
	public override visitOperationTernary(expr: EXPR.OperationTernary): OP.Value {
		return OP.conditional_expression(
			this.builder,
			expr.operand1.type.union(expr.operand2.type), // TODO: turn typeCheck optimization off and just use `expr.type` here
			() => this.visit(expr.operand0),
			() => this.visit(expr.operand1),
			() => this.visit(expr.operand2),
		);
	}

	@memoizePerNode
	public override visitSwitch(expr: EXPR.Switch): OP.Value {
		if (!expr.cases.length) {
			this.builder.pushInstruction(new OP.Drop(this.visit(expr.value)));
			return this.visit(expr.default_);
		}
		const expr_type:  TYPE.Type   = expr.type;
		const expr_value: OP.ValueTac = this.visit(expr.value).asTac(this.builder);
		return expr.cases.flatMap((kase) => {
			const consequent: () => OP.Value = () => this.visit(kase.consequent);
			return kase.antecedents.map((ant) => ({
				consequent,
				condition: () => new OP.Binop(OP.OpCode.ID, expr_value, this.visit(ant).asTac(this.builder), TYPE.BOOL),
			}));
		}).reduceRight(
			(alternative, {condition, consequent}) => () => OP.conditional_expression(this.builder, expr_type, condition, consequent, alternative),
			() => this.visit(expr.default_),
		)();
	}

	@memoizePerNode
	public override visitFunction(expr: EXPR.Function): OP.Value {
		this.#nodeVisitorBuild ??= new AstNodeVisitorBuild(this.builder);
		const temp: Temp = this.builder.newTemp(expr.type);
		return new OP.Function(temp.type as TYPE.Function, temp.name, expr.source.replaceAll(/\s+/g, ' '), () => {
			expr.captures   .forEach((capt)  => this.#nodeVisitorBuild!.visit(capt));
			expr.parameters .forEach((param) => this.#nodeVisitorBuild!.visit(param));
			return this.#nodeVisitorBuild!.visit(expr.block);
		});
	}

	public override defaultVisit(_expr: EXPR.Expression): OP.Value {
		return new OP.Trap();
	}

	#buildUnwrappedGet(access: EXPR.Access, base_val: OP.ValueTac, return_type: TYPE.Type): OP.Value {
		switch (true) {
			case access.accessor instanceof Index: {
				assert_instanceof(base_val.type, TYPE.Tuple);
				const index: bigint = access.accessor.index;
				const returned      = new OP.TupleGet(base_val, index, return_type);
				return access.isEntryOptional ? OP.conditional_expression(
					this.builder,
					new TYPE.Maybe(return_type),
					() => new OP.TupleHas(base_val, index),
					() => new OP.MaybeNew(return_type, returned.asTac(this.builder)),
					() => new OP.MaybeNew(return_type),
				) : returned;
			}
			case access.accessor instanceof Key: {
				assert_instanceof(base_val.type, TYPE.Record);
				const key      = {keyid: access.accessor.id, keysrc: access.accessor.source} as const;
				const returned = new OP.RecordGet(base_val, key, return_type);
				return access.isEntryOptional ? OP.conditional_expression(
					this.builder,
					new TYPE.Maybe(return_type),
					() => new OP.RecordHas(base_val, key),
					() => new OP.MaybeNew(return_type, returned.asTac(this.builder)),
					() => new OP.MaybeNew(return_type),
				) : returned;
			}
			default: {
				assert_instanceof(access.accessor, EXPR.Expression);
				const base_typename: OP.TypeName = OP.ast_type_name(base_val.type);
				assert.ok([OP.TypeName.LIST, OP.TypeName.DICT, OP.TypeName.SET, OP.TypeName.MAP].includes(base_typename), 'Expected base to be a List, Dict, Set, or Map.');
				return new OP.CollectionDynamicGet(
					base_typename as OP.CollectionDynamicName,
					base_val,
					this.visit(access.accessor).asTac(this.builder),
					return_type,
				);
			}
		}
	}
}
