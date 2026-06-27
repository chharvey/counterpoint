import {
	type Builder,
	type OP,
	TypeErrorNotAssignable,
} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {
	VALUE,
	TYPE,
} from '../../../typer/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type * as AST_TYPE from '../type/index.ts';
import {Expression} from './Expression.ts';




export class Claim extends Expression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Claim {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Claim);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'expression_cast'>,
		public readonly operand:      Expression,
		public readonly claimed_type: AST_TYPE.Type,
	) {
		super(start_node, {}, [operand, claimed_type]);
	}

	@memoizeMethod
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
	public override build(builder: Builder): OP.Value {
		return this.operand.build(builder);
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		return this.operand.fold();
	}
}
