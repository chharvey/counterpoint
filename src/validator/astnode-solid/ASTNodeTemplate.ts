import * as assert from 'assert';
import {
	SolidType,
	SolidObject,
	SolidString,
	INST,
	Builder,
	memoizeMethod,
	SolidConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import type {ASTNodeConstant} from './ASTNodeConstant.js';



export class ASTNodeTemplate extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTemplate {
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
	override type(): SolidType {
		return SolidType.STR;
	}
	@memoizeMethod
	override fold(): SolidString | null {
		const values: (SolidObject | null)[] = [...this.children].map((expr) => expr.fold());
		return (values.includes(null))
			? null
			: (values as SolidObject[])
				.map((value) => value.toSolidString())
				.reduce((a, b) => a.concatenate(b));
	}
}
