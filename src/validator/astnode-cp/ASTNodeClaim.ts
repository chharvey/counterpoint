import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import {
	type VALUE,
	type TYPE,
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
		private readonly operand: ASTNodeExpression,
		private readonly claimed_type: ASTNodeType,
	) {
		super(start_node, {}, [operand, claimed_type]);
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		return this.operand.build();
	}

	@memoizeMethod
	// Explicitly omitting `@typeDeco` because we don’t want to include folding logic.
	public override type(): TYPE.Type {
		const computed_type: TYPE.Type = this.operand.type();
		const claimed_type:  TYPE.Type = this.claimed_type.eval();
		/* If the types are disjoint and neither of the types are the Bottom Type, throw an error. */
		if (computed_type.intersect(claimed_type).isBottomType && !computed_type.isBottomType && !claimed_type.isBottomType) {
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
