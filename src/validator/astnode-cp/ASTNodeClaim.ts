import type binaryen from 'binaryen';
import {
	type VALUE,
	type TYPE,
	type Optimizer,
	type IR,
	TypeErrorNotAssignable,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeType} from './ASTNodeType.ts';
import {
	buildDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.ts';




export class ASTNodeClaim extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeClaim {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeClaim);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'expression_cast'>,
		public readonly operand:      ASTNodeExpression,
		public readonly claimed_type: ASTNodeType,
	) {
		super(start_node, {}, [operand, claimed_type]);
	}

	@memoizeMethod
	public override lower(_: Optimizer): IR.Value {
		throw new Error('`ASTNodeClaim#lower` not yet supported.');
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		return this.operand.build();
	}

	@memoizeMethod
	// @typeDeco // explicitly leaving off to omit folding logic
	public override type(): TYPE.Type {
		const computed_type: TYPE.Type = this.operand.type();
		const claimed_type:  TYPE.Type = this.claimed_type.eval();
		/* If the types are disjoint and neither of the types are the Bottom Type, throw an error. */
		if (computed_type.isDisjointWith(claimed_type) && !computed_type.isBottomType && !claimed_type.isBottomType) {
			/*
				`Conversion of type \`${ computed_type }\` to type \`${ claimed_type }\` may be a mistake
				because neither type sufficiently overlaps with the other.
				If this was intentional, convert the expression to \`anything\` first.`;
			*/
			throw new TypeErrorNotAssignable(this.operand, claimed_type, this);
		}
		return claimed_type;
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		return this.operand.fold();
	}
}
