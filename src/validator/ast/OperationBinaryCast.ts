import type binaryen from 'binaryen';
import type {
	VALUE,
	TYPE,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeSupertype} from '../utils-private.ts';
import {
	Operator,
	type ValidOperatorCast,
} from '../Operator.ts';
import {
	buildDeco,
	ASTNodeExpression,
} from './Expression.ts';
import {ASTNodeOperationBinary} from './OperationBinary.ts';



export class ASTNodeOperationBinaryCast extends ASTNodeOperationBinary {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryCast {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeOperationBinaryCast);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected override readonly operator: ValidOperatorCast,
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, Operator.CAST, operand0, operand1);
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		throw new Error('ASTNodeOperationBinaryCast#build not yet supported.');
	}

	protected override type_do(_t0: TYPE.Type, _t1: TYPE.Type): TYPE.Type {
		throw new Error('ASTNodeOperationBinaryCast#type not yet supported.');
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
		throw new Error('ASTNodeOperationBinaryCast#fold not yet supported.');
	}
}
