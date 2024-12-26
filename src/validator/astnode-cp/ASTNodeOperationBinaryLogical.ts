import binaryen from 'binaryen';
import {
	type VALUE,
	type TYPE,
	type LocalInfo,
	BinVect,
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
	type ValidOperatorLogical,
} from '../Operator.js';
import {buildDeco} from './decorators.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.js';



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
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		// eslint-disable-next-line prefer-const --- one of them is reassigned
		let [arg0, arg1]: binaryen.ExpressionRef[] = this.children.map((operand) => operand.build());

		const t0:     TYPE.Type              = this.operand0.type();
		const block1: binaryen.ExpressionRef = this.builder.module.block(null, [
			this.builder.module.drop(arg0),
			arg1,
		], binaryen.v128);
		if (t0.isDefinitelyFalsy()) {
			return this.operator === Operator.AND ? arg0 : block1;
		} else if (t0.isDefinitelyTruthy()) {
			return this.operator === Operator.AND ? block1 : arg0;
		}

		/** A temporary variable id used for optimizing short-circuited operations. */
		const temp_id: bigint    = this.builder.varCount;
		const local:   LocalInfo = this.builder.addLocal(temp_id, binaryen.getExpressionType(arg0))[0].getLocalInfo(temp_id)!;

		const condition: binaryen.ExpressionRef = new BinVect(this.builder.module, this.builder.module.call(
			'vnot',
			[this.builder.module.local.tee(local.index, arg0, local.type)],
			binaryen.v128,
		)).isSpecial(false);
		arg0 = this.builder.module.local.get(local.index, local.type);

		const [if_true, if_false] = (this.operator === Operator.AND) ? [arg1, arg0] : [arg0, arg1];
		return this.builder.module.if(condition, if_true, if_false);
	}

	protected override type_do(t0: TYPE.Type, t1: TYPE.Type, _int_coercion: boolean): TYPE.Type {
		switch (this.operator) {
			case Operator.AND: {
				return t0.isDefinitelyFalsy()
					? t0
					: t0.falsySide().union(t1); // also the case for if `t0.isDefinitelyTruthy()`
			}
			case Operator.OR: {
				return t0.isDefinitelyFalsy()
					? t1
					: t0.isDefinitelyTruthy()
						? t0
						: t0.truthySide().union(t1);
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
