import * as assert from 'assert';
import {
	type TYPE,
	INST,
	type Builder,
	AssignmentError01,
} from '../../index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import {SymbolStructureType} from '../index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import type {ASTNodeType} from './ASTNodeType.js';
import type {ASTNodeTypeAlias} from './ASTNodeTypeAlias.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';



export class ASTNodeDeclarationType extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeDeclarationType {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeDeclarationType);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'declaration_type'>,
		private readonly assignee: ASTNodeTypeAlias | null,
		public  readonly assigned: ASTNodeType,
	) {
		super(
			start_node,
			{},
			(assignee) ? [assignee, assigned] : [assigned],
		);
	}

	public override varCheck(): void {
		this.assigned.varCheck();
		if (this.assignee) {
			if (this.validator.hasSymbol(this.assignee.id)) {
				throw new AssignmentError01(this.assignee);
			}
			this.validator.addSymbol(new SymbolStructureType(this.assignee));
		}
	}

	public override typeCheck(): void {
		const typevalue: TYPE.Type = this.assigned.eval(); // evaluate first before checking, to rethrow any errors
		if (this.assignee) {
			assert.ok(this.validator.hasSymbol(this.assignee.id), `The validator symbol table should include ${ this.assignee.id }.`);
			const symbol = this.validator.getSymbolInfo(this.assignee.id) as SymbolStructureType;
			symbol.typevalue = typevalue;
		}
	}

	public override build(_builder: Builder): INST.InstructionNone {
		return new INST.InstructionNone();
	}
}
