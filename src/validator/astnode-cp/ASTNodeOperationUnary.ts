import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	type Optimizer,
	IR,
	drop_then,
	TypeErrorInvalidOperation,
	NanErrorInvalid,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeSupertype} from '../utils-private.ts';
import {
	Operator,
	type ValidOperatorUnary,
} from '../Operator.ts';
import {
	buildDeco,
	typeDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.ts';
import {ASTNodeOperation} from './ASTNodeOperation.ts';



export class ASTNodeOperationUnary extends ASTNodeOperation {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationUnary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeOperationUnary);
		return expression;
	}


	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		private readonly operator: ValidOperatorUnary,
		public  readonly operand:  ASTNodeExpression,
	) {
		super(start_node, operator, [operand]);
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		const arg0: binaryen.ExpressionRef = this.operand.build();
		if (this.type().isSubtypeOf(TYPE.TRUE)) {
			return drop_then(this.builder.module, [arg0], true);
		} else if (this.type().isSubtypeOf(TYPE.FALSE)) {
			return drop_then(this.builder.module, [arg0], false);
		}
		return this.builder.module.call(new Map<Operator, string>([
			[Operator.NOT,   'vnot'],
			[Operator.EMP,   'vemp'],
			[Operator.NEG,   'vneg'],
			[Operator.INT,   'vtoi'],
			[Operator.NAT,   'vton'],
			[Operator.FLOAT, 'vtof'],
		]).get(this.operator)!, [arg0], binaryen.v128);
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		const t: TYPE.Type = this.operand.type();
		if (t.isBottomType) {
			return TYPE.NOTHING;
		}
		switch (this.operator) {
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
				assert.ok(t.isSubtypeOf(TYPE.INT.union(TYPE.FLOAT)), new TypeErrorInvalidOperation(this));
				return t;
			}
			case Operator.INT: {
				assert.ok(t.isSubtypeOf(TYPE.NUMBER), new TypeErrorInvalidOperation(this));
				return TYPE.INT;
			}
			case Operator.NAT: {
				assert.ok(t.isSubtypeOf(TYPE.NUMBER), new TypeErrorInvalidOperation(this));
				return TYPE.NAT;
			}
			case Operator.FLOAT: {
				assert.ok(t.isSubtypeOf(TYPE.NUMBER), new TypeErrorInvalidOperation(this));
				return TYPE.FLOAT;
			}
		}
	}

	@memoizeMethod
	public override lower(optimizer: Optimizer): IR.Unop {
		const typ: TYPE.Type = this.type();
		const t0:  TYPE.Type = this.operand.type();
		const v0:  IR.Value  = this.operand.lower(optimizer).asTac(optimizer);
		return this.operator === Operator.NEG
			? new IR.Unop(
				t0.isSubtypeOf(TYPE.INT) ? IR.OpCode.INT_NEG : (assert.ok(t0.isSubtypeOf(TYPE.FLOAT)), IR.OpCode.FLOAT_NEG),
				v0,
				typ,
			)
			: new IR.Unop(new Map<Operator, IR.OpCodeUn>([
				[Operator.NOT,   IR.OpCode.NOT],
				[Operator.EMP,   IR.OpCode.EMP],
				[Operator.INT,   IR.OpCode.TOINT],
				[Operator.NAT,   IR.OpCode.TONAT],
				[Operator.FLOAT, IR.OpCode.TOFLOAT],
			]).get(this.operator)!, v0, typ);
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const v: VALUE.Value | null = this.operand.fold();
		if (!v) {
			return v;
		}
		switch (this.operator) {
			case Operator.NOT: {
				return VALUE.Boolean.fromBoolean(!v.isTruthy);
			}
			case Operator.EMP: {
				return VALUE.Boolean.fromBoolean(!v.isTruthy || v.isEmpty);
			}
			case Operator.NEG: {
				return this.foldNumeric(v as VALUE.Number<VALUE.Integer | VALUE.Natural | VALUE.Float>);
			}
			case Operator.INT: {
				return (v as VALUE.Number).toInt();
			}
			case Operator.NAT: {
				return (v as VALUE.Number).toNat();
			}
			case Operator.FLOAT: {
				return (v as VALUE.Number).toFloat();
			}
		}
	}

	private foldNumeric<T extends VALUE.Number<T>>(v0: T): T {
		try {
			return new Map<Operator, (z: T) => T>([
				[Operator.AFF, (z) => z],
				[Operator.NEG, (z) => z.neg()],
			]).get(this.operator)!(v0);
		} catch (err) {
			throw (err instanceof xjs.NaNError) ? new NanErrorInvalid(this) : err;
		}
	}
}
