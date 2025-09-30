import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	BinVect,
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
		const t0:   TYPE.Type              = this.operand.type();
		const arg0: binaryen.ExpressionRef = this.operand.build();
		if (this.operator === Operator.NOT) {
			if (t0.isDefinitelyFalsy) {
				return this.builder.module.block(null, [
					this.builder.module.drop(arg0),
					new BinVect(this.builder.module, true).vect,
				], binaryen.v128);
			} else if (t0.isDefinitelyTruthy) {
				return this.builder.module.block(null, [
					this.builder.module.drop(arg0),
					new BinVect(this.builder.module, false).vect,
				], binaryen.v128);
			}
		} else if (this.operator === Operator.EMP && t0.isDefinitelyFalsy) {
			return this.builder.module.block(null, [
				this.builder.module.drop(arg0),
				new BinVect(this.builder.module, true).vect,
			], binaryen.v128);
		}
		return this.builder.module.call(new Map<Operator, string>([
			[Operator.NOT, 'vnot'],
			[Operator.EMP, 'vemp'],
			[Operator.NEG, 'vneg'],
		]).get(this.operator)!, [arg0], binaryen.v128);
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		const TYPE_NUMBER = TYPE.Union.all(TYPE.INT, TYPE.FLOAT);
		const t: TYPE.Type = this.operand.type();
		if (t.isBottomType) {
			return TYPE.NEVER;
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
				assert.ok(t.isSubtypeOf(TYPE_NUMBER), new TypeErrorInvalidOperation(this));
				return t;
			}
			case Operator.INT: {
				assert.ok(t.isSubtypeOf(TYPE_NUMBER), new TypeErrorInvalidOperation(this));
				return TYPE.INT;
			}
			case Operator.FLOAT: {
				assert.ok(t.isSubtypeOf(TYPE_NUMBER), new TypeErrorInvalidOperation(this));
				return TYPE.FLOAT;
			}
		}
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const v: VALUE.Value | null = this.operand.fold();
		if (!v) {
			return v;
		}
		return (
			(this.operator === Operator.NOT) ?                VALUE.Boolean.fromBoolean(!v.isTruthy)              :
			(this.operator === Operator.EMP) ?                VALUE.Boolean.fromBoolean(!v.isTruthy || v.isEmpty) :
			(assert.strictEqual(this.operator, Operator.NEG), this.foldNumeric(v as VALUE.Number<any>)) // eslint-disable-line @typescript-eslint/no-explicit-any --- cyclical types
		);
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
