import * as assert from 'assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	OBJ,
	TYPE,
	BinVect,
	TypeError01,
	NanError01,
} from '../../index.js';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeSupertype} from '../utils-private.js';
import {
	Operator,
	type ValidOperatorUnary,
} from '../Operator.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';



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
	@ASTNodeExpression.buildDeco
	public override build(): binaryen.ExpressionRef {
		const arg0: binaryen.ExpressionRef = this.operand.build();
		if (this.operator === Operator.NOT) {
			const t0: TYPE.Type = this.operand.type();
			if (t0.isDefinitelyFalsy()) {
				return this.builder.module.block(null, [
					this.builder.module.drop(arg0),
					new BinVect(this.builder.module, true).vect,
				], binaryen.v128);
			} else if (t0.isDefinitelyTruthy()) {
				return this.builder.module.block(null, [
					this.builder.module.drop(arg0),
					new BinVect(this.builder.module, false).vect,
				], binaryen.v128);
			}
		}
		return this.builder.module.call(new Map<Operator, string>([
			[Operator.NOT, 'vnot'],
			[Operator.EMP, 'vemp'],
			[Operator.NEG, 'vneg'],
		]).get(this.operator)!, [arg0], binaryen.v128);
	}

	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		const t0: TYPE.Type = this.operand.type();
		switch (this.operator) {
			case Operator.NOT: {
				return (
					t0.isDefinitelyFalsy()  ? OBJ.Boolean.TRUETYPE :
					t0.isDefinitelyTruthy() ? OBJ.Boolean.FALSETYPE :
					TYPE.BOOL
				);
			}
			case Operator.EMP: {
				return TYPE.BOOL;
			}
			case Operator.NEG: {
				assert.ok(t0.isSubtypeOf(TYPE.INT.union(TYPE.FLOAT)), new TypeError01(this));
				return t0;
			}
		}
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const v0: OBJ.Object | null = this.operand.fold();
		if (!v0) {
			return v0;
		}
		return (
			(this.operator === Operator.NOT) ?                OBJ.Boolean.fromBoolean(!v0.isTruthy)               :
			(this.operator === Operator.EMP) ?                OBJ.Boolean.fromBoolean(!v0.isTruthy || v0.isEmpty) :
			(assert.strictEqual(this.operator, Operator.NEG), this.foldNumeric(v0 as OBJ.Number<any>)) // eslint-disable-line @typescript-eslint/no-explicit-any --- cyclical types
		);
	}

	private foldNumeric<T extends OBJ.Number<T>>(v0: T): T {
		try {
			return new Map<Operator, (z: T) => T>([
				[Operator.AFF, (z) => z],
				[Operator.NEG, (z) => z.neg()],
			]).get(this.operator)!(v0);
		} catch (err) {
			throw (err instanceof xjs.NaNError) ? new NanError01(this) : err;
		}
	}
}
