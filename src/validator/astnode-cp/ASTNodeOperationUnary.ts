import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	type Optimizer,
	IR,
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
		return new IR.Unop(new Map<Operator, IR.OpCodeUn>([
			[Operator.NOT,   IR.OpCode.NOT],
			[Operator.EMP,   IR.OpCode.EMP],
			[Operator.NEG,   IR.OpCode.NEG],
			[Operator.INT,   IR.OpCode.TOINT],
			[Operator.NAT,   IR.OpCode.TONAT],
			[Operator.FLOAT, IR.OpCode.TOFLOAT],
		]).get(this.operator)!, this.operand.lower(optimizer).asTac(optimizer), this.type());
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
