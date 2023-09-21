import * as xjs from 'extrajs';
import {
	type OBJ,
	TYPE,
	INST,
	type Builder,
	AssignmentErrorDuplicateDeclaration,
} from '../../index.js';
import {assert_instanceof} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import {SymbolStructureVar} from '../index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeType} from './ASTNodeType.js';
import type {ASTNodeExpression} from './ASTNodeExpression.js';
import type {ASTNodeVariable} from './ASTNodeVariable.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';



export class ASTNodeDeclarationVariable extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeDeclarationVariable {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeDeclarationVariable);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'declaration_variable'>,
		public  readonly unfixed:  boolean,
		private readonly assignee: ASTNodeVariable,
		public  readonly typenode: ASTNodeType,
		private readonly assigned: ASTNodeExpression,
	) {
		super(start_node, {unfixed}, [assignee, typenode, assigned]);
	}

	public override varCheck(): void {
		if (this.validator.hasSymbol(this.assignee.id)) {
			throw new AssignmentErrorDuplicateDeclaration(this.assignee);
		}
		xjs.Array.forEachAggregated([this.typenode, this.assigned], (c) => c.varCheck());
		this.validator.addSymbol(new SymbolStructureVar(this.assignee, this.unfixed));
	}

	public override typeCheck(): void {
		this.assigned.typeCheck();
		const assignee_type: TYPE.Type = this.typenode.eval();
		ASTNodeCP.assignExpression(this.assigned, assignee_type, this);
		const symbol: SymbolStructureVar | null = this.validator.getSymbolInfo(this.assignee.id) as SymbolStructureVar | null;
		if (symbol) {
			symbol.type = assignee_type;
			if (this.validator.config.compilerOptions.constantFolding && !symbol.type.hasMutable && !this.unfixed) {
				symbol.value = this.assigned.fold();
			}
		}
	}

	public override build(builder: Builder): INST.InstructionNone | INST.InstructionDeclareGlobal {
		const tofloat: boolean = this.typenode.eval().isSubtypeOf(TYPE.FLOAT) || this.assigned.shouldFloat();
		const value: OBJ.Object | null = this.assignee.fold();
		return (this.validator.config.compilerOptions.constantFolding && !this.unfixed && value)
			? new INST.InstructionNone()
			: new INST.InstructionDeclareGlobal(this.assignee.id, this.unfixed, this.assigned.build(builder, tofloat));
	}
}
