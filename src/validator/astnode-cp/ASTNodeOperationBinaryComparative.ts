import * as assert from 'node:assert';
import binaryen from 'binaryen';
import {
	VALUE,
	TYPE,
	TypeErrorInvalidOperation,
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
	type ValidOperatorComparative,
} from '../Operator.ts';
import {
	bothInts,
	bothFloats,
} from './utils-private.ts';
import {
	buildDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.ts';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.ts';



export class ASTNodeOperationBinaryComparative extends ASTNodeOperationBinary {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryComparative {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeOperationBinaryComparative);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected override readonly operator: ValidOperatorComparative,
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
		if ([Operator.IS, Operator.ISNT].includes(this.operator)) {
			throw new TypeError(`Operator ${ this.operator } not yet supported.`);
		}
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		return this.builder.module.call(new Map<Operator, string>([
			[Operator.LT, 'vlt'],
			[Operator.GT, 'vgt'],
			[Operator.LE, 'vle'],
			[Operator.GE, 'vge'],
		]).get(this.operator)!, [this.operand0.build(), this.operand1.build()], binaryen.v128);
	}

	protected override type_do(t0: TYPE.Type, t1: TYPE.Type): TYPE.Type {
		if (t0.isBottomType || t1.isBottomType) {
			return TYPE.NEVER;
		}
		return (
			bothInts(t0, t1) || bothFloats(t0, t1) ? TYPE.BOOL :
			assert.fail(new TypeErrorInvalidOperation(this))
		);
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const v0: VALUE.Value | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		const v1: VALUE.Value | null = this.operand1.fold();
		if (!v1) {
			return v1;
		}
		return this.foldComparative(
			(v0 as VALUE.Number<VALUE.Integer | VALUE.Float>),
			(v1 as VALUE.Number<VALUE.Integer | VALUE.Float>),
		);
	}

	private foldComparative<T extends VALUE.Number<T>>(v0: T, v1: T): VALUE.Boolean {
		return VALUE.Boolean.fromBoolean(new Map<Operator, (x: T, y: T) => boolean>([
			[Operator.LT, (x, y) => x.lt(y)],
			[Operator.GT, (x, y) => y.lt(x)],
			[Operator.LE, (x, y) => x.equal(y) || x.lt(y)],
			[Operator.GE, (x, y) => x.equal(y) || y.lt(x)],
			// [Operator.NLT, (x, y) => !x.lt(y)],
			// [Operator.NGT, (x, y) => !y.lt(x)],
		]).get(this.operator)!(v0, v1));
	}
}
