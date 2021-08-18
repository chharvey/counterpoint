import type {ParseNode} from '@chharvey/parser';
import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
} from '../core/index.js';
import {
	SolidType,
	SolidObject,
	SolidString,
} from '../typer/index.js';
import type {
	Builder,
	INST,
} from '../builder/index.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import type {ASTNodeConstant} from './ASTNodeConstant.js';
import type {Validator} from './Validator.js';



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
	protected override assess_do(validator: Validator): SolidString | null {
		const assesses: (SolidObject | null)[] = [...this.children].map((expr) => expr.assess(validator));
		return (assesses.includes(null))
			? null
			: (assesses as SolidObject[])
				.map((value) => value.toSolidString())
				.reduce((a, b) => a.concatenate(b));
	}
}
