import * as assert from 'assert';
import {
	INST,
	Builder,
	AssignmentError01,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	Validator,
	SymbolStructureType,
} from './package.js';
import type {ASTNodeType} from './ASTNodeType.js';
import type {ASTNodeTypeAlias} from './ASTNodeTypeAlias.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';



export class ASTNodeDeclarationType extends ASTNodeStatement {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeDeclarationType {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeDeclarationType);
		return statement;
	}
	constructor (
		start_node: ParseNode,
		readonly assignee: ASTNodeTypeAlias,
		readonly assigned: ASTNodeType,
	) {
		super(start_node, {}, [assignee, assigned]);
	}
	override varCheck(validator: Validator): void {
		if (validator.hasSymbol(this.assignee.id)) {
			throw new AssignmentError01(this.assignee);
		};
		this.assigned.varCheck(validator);
		validator.addSymbol(new SymbolStructureType(this.assignee));
	}
	override typeCheck(validator: Validator): void {
		const symbol: SymbolStructureType | null = validator.getSymbolInfo(this.assignee.id) as SymbolStructureType | null;
		if (symbol) {
			symbol.typevalue = this.assigned.eval(validator);
		}
	}
	override build(_builder: Builder): INST.InstructionNone {
		return new INST.InstructionNone();
	}
}
