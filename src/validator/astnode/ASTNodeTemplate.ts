import type {ParseNode} from '@chharvey/parser';
import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	SolidType,
	SolidObject,
	SolidString,
	INST,
	Builder,
	Validator,
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
		start_node: ParseNode,
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
	override shouldFloat(_validator: Validator): boolean {
		throw new Error('ASTNodeTemplate#shouldFloat not yet supported.');
	}
	protected override build_do(_builder: Builder): INST.InstructionExpression {
		throw new Error('ASTNodeTemplate#build_do not yet supported.');
	}
	protected override type_do(_validator: Validator): SolidType {
		return SolidString
	}
	protected override fold_do(validator: Validator): SolidString | null {
		const values: (SolidObject | null)[] = [...this.children].map((expr) => expr.fold(validator));
		return (values.includes(null))
			? null
			: (values as SolidObject[])
				.map((value) => value.toSolidString())
				.reduce((a, b) => a.concatenate(b));
	}
}
