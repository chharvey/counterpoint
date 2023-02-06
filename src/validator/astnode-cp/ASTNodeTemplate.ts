import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	TYPE,
	OBJ,
	Builder,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import type {ASTNodeConstant} from './ASTNodeConstant.js';



export class ASTNodeTemplate extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTemplate {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeTemplate);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'string_template'>,
		public override readonly children: // FIXME spread types
			| readonly [ASTNodeConstant]
			| readonly [ASTNodeConstant,                                                           ASTNodeConstant]
			| readonly [ASTNodeConstant, ASTNodeExpression,                                        ASTNodeConstant]
			// | readonly [ASTNodeConstant,                    ...ASTNodeTemplatePartialChildrenType, ASTNodeConstant]
			// | readonly [ASTNodeConstant, ASTNodeExpression, ...ASTNodeTemplatePartialChildrenType, ASTNodeConstant]
			| readonly ASTNodeExpression[]
		,
	) {
		super(start_node, {}, children);
	}

	protected override build_do(builder: Builder): binaryen.ExpressionRef {
		builder;
		throw '`ASTNodeTemplate#build_do` not yet supported.';
	}

	protected override type_do(): TYPE.Type {
		return TYPE.STR;
	}

	protected override fold_do(): OBJ.String | null {
		const values: Array<OBJ.Object | null> = [...this.children].map((expr) => expr.fold());
		return (values.includes(null))
			? null
			: (values as OBJ.Object[])
				.map((value) => value.toCPString())
				.reduce((a, b) => a.concatenate(b));
	}
}
