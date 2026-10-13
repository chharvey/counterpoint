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
import {IntrinsicName} from '../../../parser/index.ts';
import type {SymbolSchemaVar} from '../../index.ts';
import {Operator} from '../../Operator.ts';
import type {CallableClassName} from '../utils-private.ts';
import {Index} from '../Index-.ts';
import {Key} from '../Key.ts';
import * as EXPR from '../expression/index.ts';
import type * as STMT from '../statement/index.ts';
import {VisitorStmtBuild} from './VisitorStmtBuild.ts';



function memoizePerExprNode<ProtoThis extends object, Param extends EXPR.Expression, Return>(
	method:   (this: ProtoThis, arg: Param) => Return,
	_context: ClassMethodDecoratorContext<ProtoThis, typeof method>,
): typeof method {
	const memomap = new WeakMap<Param, Return>();
	return function (arg) {
		// TODO: Map#getOrInsertComputed
		memomap.has(arg) || memomap.set(arg, method.call(this, arg));
		return memomap.get(arg)!;
	};
}



export class VisitorExprBuild extends EXPR.ExprVisitor<OP.Value> {
	public constructor(private readonly builder: Builder) {
		super();
	}


	@memoizePerExprNode
	public override visitConstant(expr: EXPR.Constant): OP.Value {
		return new OP.Const(expr.interpreterValue);
	}

	@memoizePerExprNode
	public override visitTemplate(expr: EXPR.Template): OP.Value {
		return new OP.Template(expr.children.map((c) => {
			const build: OP.ValueTac = this.visit(c).asTac(this.builder);
			return c.type().isSubtypeOf(TYPE.STR)
				? build
				: new OP.Unop(OP.OpCode.STR_FROM, build, TYPE.STR).asTac(this.builder);
		}));
	}

	@memoizePerExprNode
	public override visitVariable(expr: EXPR.Variable): OP.Value {
		const symbol = expr.validator.getSymbol(expr.id) as SymbolSchemaVar;
		return new OP.Get(symbol, symbol.irType);
	}

	@memoizePerExprNode
	public override visitTuple(expr: EXPR.Tuple): OP.Value {
		return new OP.CollectionLinearNew(OP.TypeName.TUPLE, expr.children.map((c) => this.visit(c).asTac(this.builder)), expr.type());
	}

	@memoizePerExprNode
	public override visitRecord(expr: EXPR.Record): OP.Value {
		return new OP.RecordNew(new Map(expr.children.map((c) => ([
			c.key.id,
			{keysrc: c.key.source, value: this.visit(c.val).asTac(this.builder)},
		]))), expr.type());
	}

	@memoizePerExprNode
	public override visitList(expr: EXPR.List): OP.Value {
		return new OP.CollectionLinearNew(OP.TypeName.LIST, expr.children.map((c) => this.visit(c).asTac(this.builder)), expr.type());
	}

	@memoizePerExprNode
	public override visitDict(expr: EXPR.Dict): OP.Value {
		return new OP.DictNew(new Map(expr.children.map((c) => [
			new VALUE.Symbol(c.key.id, c.key.source),
			this.visit(c.val).asTac(this.builder),
		])), expr.type());
	}

	@memoizePerExprNode
	public override visitSet(expr: EXPR.Set): OP.Value {
		return new OP.CollectionLinearNew(OP.TypeName.SET, expr.children.map((c) => this.visit(c).asTac(this.builder)), expr.type());
	}

	@memoizePerExprNode
	public override visitMap(expr: EXPR.Map): OP.Value {
		return new OP.MapNew(new Map(expr.children.map((c) => [
			this.visit(c.antecedents[0]) .asTac(this.builder),
			this.visit(c.consequent)     .asTac(this.builder),
		])), expr.type());
	}

	@memoizePerExprNode
	public override visitExprBlock(expr: EXPR.ExpressionBlock): OP.Value {
		const stmt_visitor = new VisitorStmtBuild(this.builder);
		expr.block.children.slice(0, -1).forEach((stmt) => stmt_visitor.visit(stmt));
		return this.visit((expr.block.children.at(-1) as STMT.StatementExpression).expr!);
	}

	@memoizePerExprNode
	public override visitAccess(expr: EXPR.Access): OP.Value {
		const build_non_maybe_base = (base_val: OP.ValueTac, return_type: TYPE.Type): OP.Value | undefined => {
			switch (true) {
				case expr.accessor instanceof Index: {
					assert_instanceof(base_val.type, TYPE.Tuple);
					/*
					 * Ensure a canonical index. It may be within the mathematical range *[0, count - 1]*.
					 * We cannot assume that this index is validated by the type-checker,
					 * since the actual type of the base may be narrower than its declared type.
					 * E.g.:
					 * ```
					 * val tuple: (int, ?: float) = (42,);
					 * tuple?.1;
					 * ```
					 * The accessor is valid, but we want to make sure
					 * we don’t accidentally try to get the value there at runtime.
					 * If the index is out of range, drop the base and return a None.
					 * We can assert there are no optional entries since this tuple type was created by the AST expression (`TYPE.Tuple.fromTypes`).
					 */
					if (base_val.type.isIndexCanonical(expr.accessor.index)) {
						return new OP.TupleGet(base_val, expr.accessor.index, return_type);
					} else {
						this.builder.pushInstruction(new OP.Drop(base_val));
						return undefined;
					}
				}
				case expr.accessor instanceof Key: {
					assert_instanceof(base_val.type, TYPE.Record);
					/*
					 * Ensure a canonical key. It must have been added to the value’s type.
					 * We cannot assume that this key is validated by the type-checker,
					 * since the actual type of the base may be narrower than its declared type.
					 * E.g.:
					 * ```
					 * val record: (a: int, b?: float) = (a= 42);
					 * record?.b;
					 * ```
					 * The accessor is valid, but we want to make sure
					 * we don’t accidentally try to get the value there at runtime.
					 * If the key is not canonical, drop the base and return a None.
					 * We can assert there are no optional entries since this record type was created by the AST expression (`TYPE.Record.fromTypes`).
					 *
					 * Note: Key hashing will be taken care of in the codegen phase.
					 */
					if (base_val.type.isKeyCanonical(expr.accessor.id)) {
						return new OP.RecordGet(base_val, {keyid: expr.accessor.id, keysrc: expr.accessor.source}, return_type);
					} else {
						this.builder.pushInstruction(new OP.Drop(base_val));
						return undefined;
					}
				}
				default: {
					assert_instanceof(expr.accessor, EXPR.Expression);
					const base_typename: OP.TypeName = OP.ast_type_name(base_val.type);
					assert.ok([OP.TypeName.LIST, OP.TypeName.DICT, OP.TypeName.SET, OP.TypeName.MAP].includes(base_typename), 'Expected base to be a List, Dict, Set, or Map.');
					return new OP.CollectionDynamicGet(
						base_typename as OP.CollectionDynamicName,
						base_val,
						this.visit(expr.accessor).asTac(this.builder),
						return_type,
					);
				}
			}
		};

		const typ:        TYPE.Type   = expr.type();
		const base_value: OP.ValueTac = this.visit(expr.base).asTac(this.builder);

		if (expr.kind === Operator.DOT_MAYBE) {
			assert_instanceof(typ, TYPE.Maybe);
			return OP.conditional_expression(
				this.builder,
				typ,
				() => new OP.Instance(OP.OpCode.INSTANCEOF, IntrinsicName.NONE, base_value),
				() => new OP.MaybeNew(typ.typearg),
				() => new OP.MaybeNew(typ.typearg, build_non_maybe_base(
					base_value.type instanceof TYPE.Maybe ? new OP.Unop(OP.OpCode.MAYBE_UNWRAP, base_value, base_value.type.typearg).asTac(this.builder) : base_value,
					typ.typearg,
				)?.asTac(this.builder)),
			);
		}
		return build_non_maybe_base(base_value, typ)!; // if not Maybe access, asserts it will always return a value
	}

	@memoizePerExprNode
	public override visitCall(expr: EXPR.Call): OP.Value {
		/*
		 * Note: Eventually, calls will be dynamic; all we’d need to return is a new `OP.Call` object.
		 * But until we get functions and classes, statically build the function calls.
		 */
		if (false) { // eslint-disable-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
			return new OP.Call(
				this.visit(expr.base).asTac(this.builder),
				expr.exprargs.map((arg) => this.visit(arg).asTac(this.builder)),
				expr.type(),
			);
		}

		const base_source = expr.base.source as CallableClassName;
		switch (base_source) {
			case IntrinsicName.BOOLEAN:
			case IntrinsicName.INTEGER:
			case IntrinsicName.NATURAL:
			case IntrinsicName.FLOAT:
			case IntrinsicName.STRING: {
				return new OP.Unop(new Map<IntrinsicName, OP.OpCodeUn>([
					[IntrinsicName.BOOLEAN, OP.OpCode.BOOL_FROM],
					[IntrinsicName.INTEGER, OP.OpCode.INT_FROM],
					[IntrinsicName.NATURAL, OP.OpCode.NAT_FROM],
					[IntrinsicName.FLOAT,   OP.OpCode.FLOAT_FROM],
					[IntrinsicName.STRING,  OP.OpCode.STR_FROM],
				]).get(base_source)!, this.visit(expr.exprargs[0]).asTac(this.builder), expr.type());
			}
			case IntrinsicName.LIST:
			case IntrinsicName.DICT:
			case IntrinsicName.SET:
			case IntrinsicName.MAP: {
				const [name, ctor] = new Map<IntrinsicName, [OP.CollectionDynamicName, () => OP.Value]>([
					[IntrinsicName.LIST, [OP.TypeName.LIST, () => new OP.CollectionLinearNew(OP.TypeName.LIST, [], expr.type())]],
					[IntrinsicName.SET,  [OP.TypeName.SET,  () => new OP.CollectionLinearNew(OP.TypeName.SET,  [], expr.type())]],
					[IntrinsicName.DICT, [OP.TypeName.DICT, () => new OP.DictNew (new Map(), expr.type())]],
					[IntrinsicName.MAP,  [OP.TypeName.MAP,  () => new OP.MapNew  (new Map(), expr.type())]],
				]).get(base_source)!;
				const new_obj: OP.Value = ctor();
				if (!expr.exprargs.length) {
					return new_obj;
				}
				const dest: OP.ValueTac = new_obj.asTac(this.builder);
				this.builder.pushInstruction(new OP.CollectionDynamicCopy(name, dest, this.visit(expr.exprargs[0]).asTac(this.builder)));
				return dest;
			}
			case IntrinsicName.NONE:
			case IntrinsicName.SOME: {
				return new OP.MaybeNew(expr.typeargs[0].eval(), expr.exprargs[0] ? this.visit(expr.exprargs[0]).asTac(this.builder) : undefined);
			}
			default: {
				assert.fail(`Did not expect base '${base_source}'.`);
			}
		}
	}

	@memoizePerExprNode
	public override visitClaim(expr: EXPR.Claim): OP.Value {
		return this.visit(expr.operand);
	}

	@memoizePerExprNode
	public override visitOperationUnary(expr: EXPR.OperationUnary): OP.Value {
		if (expr.operator === Operator.UN_RESULT) {
			throw new Error('not yet supported.');
		}
		return new OP.Unop(new Map<Operator, OP.OpCodeUn>([
			[Operator.UN_MAYBE, OP.OpCode.MAYBE_UNWRAP],
			[Operator.NOT,      OP.OpCode.NOT],
			[Operator.EMP,      OP.OpCode.EMP],
			[Operator.NEG,      OP.OpCode.NEG],
		]).get(expr.operator)!, this.visit(expr.operand).asTac(this.builder), expr.type());
	}

	@memoizePerExprNode
	public override visitOperationBinaryCast(expr: EXPR.OperationBinaryCast): OP.Value {
		const op0: OP.ValueTac = this.visit(expr.operand0).asTac(this.builder);
		const op1_source = expr.operand1.source as IntrinsicName;
		const is_instance = (): OP.Value => {
			switch (op1_source) {
				case IntrinsicName.NULL: {
					return new OP.Binop(OP.OpCode.ID, op0, new OP.Const(VALUE.NULL), TYPE.BOOL);
				}
				case IntrinsicName.BOOLEAN: {
					const left: OP.ValueTac = new OP.Binop(OP.OpCode.ID, op0, new OP.Const(VALUE.FALSE), TYPE.BOOL).asTac(this.builder);
					return OP.conditional_expression(
						this.builder,
						TYPE.BOOL,
						() => left,
						() => left,
						() => new OP.Binop(OP.OpCode.ID, op0, new OP.Const(VALUE.TRUE), TYPE.BOOL),
					);
				}
			}
			return new OP.Instance(OP.OpCode.INSTANCEOF, op1_source, op0);
		};
		switch (expr.operator) {
			case Operator.IS: {
				return is_instance();
			}
			case Operator.CAST: {
				return new OP.Instance(OP.OpCode.CAST, op1_source, op0);
			}
			case Operator.CAST_MAYBE: {
				const expr_type = expr.type() as TYPE.Maybe;
				return OP.conditional_expression(
					this.builder,
					expr_type,
					is_instance,
					() => new OP.MaybeNew(expr_type.typearg, new OP.Instance(OP.OpCode.CAST, op1_source, op0)),
					() => new OP.MaybeNew(expr_type.typearg),
				);
			}
		}
	}

	@memoizePerExprNode
	public override visitOperationBinaryArithmetic(expr: EXPR.OperationBinaryArithmetic): OP.Value {
		// TODO: move these functions to utils
		function bothInts(t0: TYPE.Type, t1: TYPE.Type): boolean {
			return t0.isSubtypeOf(TYPE.INT) && t1.isSubtypeOf(TYPE.INT);
		}

		function bothNats(t0: TYPE.Type, t1: TYPE.Type): boolean {
			return t0.isSubtypeOf(TYPE.NAT) && t1.isSubtypeOf(TYPE.NAT);
		}

		function bothFloats(t0: TYPE.Type, t1: TYPE.Type): boolean {
			return t0.isSubtypeOf(TYPE.FLOAT) && t1.isSubtypeOf(TYPE.FLOAT);
		}
		const typ: TYPE.Type = expr.type();
		const [t0, t1] = [expr.operand0.type(),                          expr.operand1.type()];
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

	@memoizePerExprNode
	public override visitOperationBinaryComparative(expr: EXPR.OperationBinaryComparative): OP.Value {
		return new OP.Binop(new Map<Operator, OP.OpCodeBin>([
			[Operator.LT, OP.OpCode.LT],
			[Operator.GT, OP.OpCode.GT],
			[Operator.LE, OP.OpCode.LE],
			[Operator.GE, OP.OpCode.GE],
		]).get(expr.operator)!, this.visit(expr.operand0).asTac(this.builder), this.visit(expr.operand1).asTac(this.builder), expr.type());
	}

	@memoizePerExprNode
	public override visitOperationBinaryEquality(expr: EXPR.OperationBinaryEquality): OP.Value {
		return new OP.Binop(new Map<Operator, OP.OpCodeBin>([
			[Operator.ID, OP.OpCode.ID],
			[Operator.EQ, OP.OpCode.EQ],
		]).get(expr.operator)!, this.visit(expr.operand0).asTac(this.builder), this.visit(expr.operand1).asTac(this.builder), expr.type());
	}

	@memoizePerExprNode
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
			expr.operand0.type().union(expr.operand1.type()), // TODO: turn typeCheck optimization off and just use `expr.type()` here
			() => new OP.Unop(OP.OpCode.BOOL_FROM, left, TYPE.BOOL),
			conseq,
			altern,
		);
	}

	@memoizePerExprNode
	public override visitOperationTernary(expr: EXPR.OperationTernary): OP.Value {
		return OP.conditional_expression(
			this.builder,
			expr.operand1.type().union(expr.operand2.type()), // TODO: turn typeCheck optimization off and just use `expr.type()` here
			() => this.visit(expr.operand0),
			() => this.visit(expr.operand1),
			() => this.visit(expr.operand2),
		);
	}

	@memoizePerExprNode
	public override visitSwitch(expr: EXPR.Switch): OP.Value {
		if (!expr.cases.length) {
			this.builder.pushInstruction(new OP.Drop(this.visit(expr.value)));
			return this.visit(expr.default_);
		}
		const expr_type:  TYPE.Type   = expr.type();
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

	@memoizePerExprNode
	public override visitFunction(expr: EXPR.Function): OP.Value {
		const temp: Temp = this.builder.newTemp(expr.type());
		return new OP.Function(temp.type as TYPE.Function, temp.name, expr.source.replaceAll(/\s+/g, ' '), () => {
			expr.captures.forEach((capt) => capt.build(this.builder));
			expr.parameters.forEach((param) => param.build(this.builder));
			expr.block.build(this.builder);
		});
	}

	public override defaultVisit(_expr: EXPR.Expression): OP.Value {
		return new OP.Trap();
	}
}
