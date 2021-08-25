import type {ParseNode} from '@chharvey/parser';
import * as assert from 'assert';
import {
	AssignmentError01,
	SolidConfig,
	CONFIG_DEFAULT,
	INST,
	Builder,
} from './package.js';
import type {ASTNodeType} from './ASTNodeType.js';
import type {ASTNodeTypeAlias} from './ASTNodeTypeAlias.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';
import type {Validator} from './Validator.js';
import {SymbolStructureType} from './SymbolStructure.js';



export class ASTNodeDeclarationType extends ASTNodeStatement {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeDeclarationType {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeDeclarationType);
		return statement;
	}
	constructor (
		start_node: ParseNode,
		readonly variable: ASTNodeTypeAlias,
		readonly value:    ASTNodeType,
	) {
		super(start_node, {}, [variable, value]);
	}
	override varCheck(validator: Validator): void {
		if (validator.hasSymbol(this.variable.id)) {
			throw new AssignmentError01(this.variable);
		};
		this.value.varCheck(validator);
		validator.addSymbol(new SymbolStructureType(
			this.variable.id,
			this.variable.line_index,
			this.variable.col_index,
			this.variable.source,
			() => this.value.assess(validator),
		));
	}
	override typeCheck(validator: Validator): void {
		this.value.typeCheck(validator);
		return validator.getSymbolInfo(this.variable.id)?.assess();
	}
	override build(_builder: Builder): INST.InstructionNone {
		return new INST.InstructionNone();
	}
}
