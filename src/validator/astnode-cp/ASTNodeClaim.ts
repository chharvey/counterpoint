import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import {
	type VALUE,
	TYPE,
	TypeErrorNotAssignable,
} from '../../index.js';
import {memoizeMethod} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import type {ASTNodeType} from './ASTNodeType.js';
import {
	buildDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.js';




export class ASTNodeClaim extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeClaim {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeClaim);
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
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		return this.operand.build();
	}

	@memoizeMethod
	// @typeDeco // explicitly leaving off to omit folding logic
	public override type(): TYPE.Type {
		const computed_type:  TYPE.Type = this.operand.type();
		const claimed_type:   TYPE.Type = this.claimed_type.eval();
		const computed_shape: TYPE.Type = computed_type instanceof TYPE.Nominal ? computed_type.shape : computed_type;
		const claimed_shape:  TYPE.Type = claimed_type  instanceof TYPE.Nominal ? claimed_type.shape  : claimed_type;
		/* If the type shapes are disjoint and neither of the types are the Bottom Type, throw an error. */
		if (computed_shape.intersect(claimed_shape).isBottomType && !computed_type.isBottomType && !claimed_type.isBottomType) {
			/*
				`Conversion of type \`${ computed_type }\` to type \`${ claimed_type }\` may be a mistake
				because neither type sufficiently overlaps with the other.
				If this was intentional, convert the expression to \`anything\` first.`;
			*/
			throw new TypeErrorNotAssignable(computed_type, claimed_type, this);
		}
		return claimed_type;
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		return this.operand.fold();
	}
}
