import binaryen from 'binaryen';
import {
	type VALUE,
	TYPE,
	type CFG,
	type Local,
	BinVect,
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
	type ValidOperatorLogical,
} from '../Operator.ts';
import {
	lowerDeco,
	buildDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.ts';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.ts';



export class ASTNodeOperationBinaryLogical extends ASTNodeOperationBinary {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryLogical {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeOperationBinaryLogical);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected override readonly operator: ValidOperatorLogical,
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
	}

	@memoizeMethod
	@lowerDeco
	public override lower(): CFG.Value {
		throw new Error('`ASTNodeOperationBinaryLogical#lower` not yet supported.');
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		// eslint-disable-next-line prefer-const --- one of them is reassigned
		let [arg0, arg1]: binaryen.ExpressionRef[] = this.children.map((operand) => operand.build());

		const t0:     TYPE.Type              = this.operand0.type();
		const block1: binaryen.ExpressionRef = this.builder.module.block(null, [
			this.builder.module.drop(arg0),
			arg1,
		], binaryen.v128);
		if (t0.isDefinitelyFalsy) {
			return this.operator === Operator.AND ? arg0 : block1;
		} else if (t0.isDefinitelyTruthy) {
			return this.operator === Operator.AND ? block1 : arg0;
		}

		const local: Local = this.builder.addLocal(arg0)[1];

		const condition: binaryen.ExpressionRef = new BinVect(this.builder.module, this.builder.module.call(
			'vnot',
			[local.tee()],
			binaryen.v128,
		)).isSpecial(false);
		arg0 = local.get();

		const [if_true, if_false] = (this.operator === Operator.AND) ? [arg1, arg0] : [arg0, arg1];
		return this.builder.module.if(condition, if_true, if_false);
	}

	protected override type_do(t0: TYPE.Type, t1: TYPE.Type): TYPE.Type {
		if (t0.isBottomType) {
			return TYPE.NEVER;
		}
		switch (this.operator) {
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

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const v0: VALUE.Value | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		if (
			this.operator === Operator.AND && !v0.isTruthy ||
			this.operator === Operator.OR  &&  v0.isTruthy
		) {
			return v0;
		}
		return this.operand1.fold();
	}
}
