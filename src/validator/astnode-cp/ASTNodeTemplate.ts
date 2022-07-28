import * as assert from 'assert';
import {
	TYPE,
	OBJ,
	INST,
	Builder,
	memoizeMethod,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import type {ASTNodeConstant} from './ASTNodeConstant.js';



export class ASTNodeTemplate extends ASTNodeExpression {
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTemplate {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeTemplate);
		return expression;
	}
	constructor(
		start_node: SyntaxNodeType<'string_template'>,
		override readonly children: // FIXME spread types
			| readonly [ASTNodeConstant]
			| readonly [ASTNodeConstant,                                                           ASTNodeConstant]
			| readonly [ASTNodeConstant, ASTNodeExpression,                                        ASTNodeConstant]
			// | readonly [ASTNodeConstant,                    ...ASTNodeTemplatePartialChildrenType, ASTNodeConstant]
			// | readonly [ASTNodeConstant, ASTNodeExpression, ...ASTNodeTemplatePartialChildrenType, ASTNodeConstant]
			| readonly ASTNodeExpression[]
		,
	) {
		super(start_node, {}, children)
	}
	override shouldFloat(): boolean {
		throw new Error('ASTNodeTemplate#shouldFloat not yet supported.');
	}
	@memoizeMethod
	@ASTNodeExpression.buildDeco
	override build(_builder: Builder): INST.InstructionExpression {
		throw new Error('ASTNodeTemplate#build not yet supported.');
	}
	@memoizeMethod
	@ASTNodeExpression.typeDeco
	override type(): TYPE.Type {
		return TYPE.Type.STR;
	}
	@memoizeMethod
	override fold(): OBJ.String | null {
		const values: (OBJ.Object | null)[] = [...this.children].map((expr) => expr.fold());
		return (values.includes(null))
			? null
			: (values as OBJ.Object[])
				.map((value) => value.toCPString())
				.reduce((a, b) => a.concatenate(b));
	}
}
