import * as assert from 'assert';
import {
	Builder,
	INST,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
} from './package.js';
import type {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';



export class ASTNodeStatementExpression extends ASTNodeStatement {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeStatementExpression {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeStatementExpression);
		return statement;
	}
	constructor(
		start_node: ParseNode,
		readonly expr?: ASTNodeExpression,
	) {
		super(start_node, {}, (expr) ? [expr] : void 0);
	}
	override build(builder: Builder): INST.InstructionNop | INST.InstructionDrop {
		return (this.expr)
			? new INST.InstructionDrop(this.expr.build(builder))
			: INST.NOP;
	}
}
