import * as assert from 'assert';
import {
	INST,
	Builder,
	AssignmentError01,
	CPConfig,
	CONFIG_DEFAULT,
	SymbolStructureType,
	SyntaxNodeType,
} from './package.js';
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
		private readonly assignee: ASTNodeTypeAlias,
		public  readonly assigned: ASTNodeType,
	) {
		super(start_node, {}, [assignee, assigned]);
	}

	public override varCheck(): void {
		if (this.validator.hasSymbol(this.assignee.id)) {
			throw new AssignmentError01(this.assignee);
		}
		this.assigned.varCheck();
		this.validator.addSymbol(new SymbolStructureType(this.assignee));
	}

	public override typeCheck(): void {
		const symbol: SymbolStructureType | null = this.validator.getSymbolInfo(this.assignee.id) as SymbolStructureType | null;
		if (symbol) {
			symbol.typevalue = this.assigned.eval();
		}
	}

	public override build(_builder: Builder): INST.InstructionNone {
		return new INST.InstructionNone();
	}
}