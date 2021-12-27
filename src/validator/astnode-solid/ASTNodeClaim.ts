import * as assert from 'assert';
import {
	SolidType,
	SolidObject,
	INST,
	Builder,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
} from './package.js';
import type {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';




export class ASTNodeClaim extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeClaim {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeClaim);
		return expression;
	}
	constructor(
		start_node: ParseNode,
		readonly claimed_type: ASTNodeType,
		readonly operand: ASTNodeExpression,
	) {
		super(start_node, {}, [claimed_type, operand]);
	}
	override shouldFloat(): boolean {
		throw 'TODO';
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionExpression {
		throw builder && to_float && 'TODO';
	}
	protected override type_do(): SolidType {
		throw 'TODO';
	}
	protected override fold_do(): SolidObject | null {
		throw 'TODO';
	}
}
