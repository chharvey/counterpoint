import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	OBJ,
	TYPE,
	Builder,
} from '../../index.js';
import {memoizeMethod} from '../../lib/index.js';
import {
	CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
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

	@memoizeMethod
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder): binaryen.ExpressionRef {
		builder;
		throw '`ASTNodeTemplate#build` not yet supported.';
	}

	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		return TYPE.STR;
	}

	@memoizeMethod
	public override fold(): OBJ.String | null {
		const values: Array<OBJ.Object | null> = [...this.children].map((expr) => expr.fold());
		return (values.includes(null))
			? null
			: (values as OBJ.Object[])
				.map((value) => value.toCPString())
				.reduce((a, b) => a.concatenate(b));
	}
}
