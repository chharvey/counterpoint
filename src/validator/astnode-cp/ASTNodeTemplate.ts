import type binaryen from 'binaryen';
import {
	type VALUE,
	TYPE,
	type IR,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {
	lowerDeco,
	buildDeco,
	typeDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.ts';
import type {ASTNodeConstant} from './ASTNodeConstant.ts';



export class ASTNodeTemplate extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTemplate {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeTemplate);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'string_template', ['break']>,
		public override readonly children: // FIXME spread types
			| readonly [ASTNodeConstant]
			| readonly [ASTNodeConstant,                                                           ASTNodeConstant]
			| readonly [ASTNodeConstant, ASTNodeExpression,                                        ASTNodeConstant]
			// | readonly [ASTNodeConstant,                    ...ASTNodeTemplatePartialChildrenType, ASTNodeConstant]
			// | readonly [ASTNodeConstant, ASTNodeExpression, ...ASTNodeTemplatePartialChildrenType, ASTNodeConstant]
			| readonly ASTNodeExpression[],
	) {
		super(start_node, {}, children);
	}

	@memoizeMethod
	@lowerDeco
	public lower(): IR.Instruction {
		throw new Error('`ASTNodeTemplate#lower` not yet supported.');
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		throw new Error('`ASTNodeTemplate#build` not yet supported.');
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		return TYPE.STR;
	}

	@memoizeMethod
	public override fold(): VALUE.String | null {
		const values: readonly (VALUE.Value | null)[] = [...this.children].map((expr) => expr.fold());
		return (values.includes(null))
			? null
			: (values as readonly VALUE.Value[])
				.map((value) => value.toCPString())
				.reduce((a, b) => a.concatenate(b));
	}
}
