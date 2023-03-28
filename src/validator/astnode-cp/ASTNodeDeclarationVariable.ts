import * as assert from 'assert';
import * as xjs from 'extrajs';
import {
	type OBJ,
	TYPE,
	INST,
	type Builder,
	AssignmentError01,
} from '../../index.js';
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
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';



export class ASTNodeDeclarationVariable extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeDeclarationVariable {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeDeclarationVariable);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'declaration_variable'>,
		public  readonly unfixed:  boolean,
		private readonly assignee: ASTNodeVariable | null,
		private readonly typenode: ASTNodeType,
		private readonly assigned: ASTNodeExpression,
	) {
		super(
			start_node,
			{unfixed},
			(assignee) ? [assignee, typenode, assigned] : [typenode, assigned],
		);
	}

	public override varCheck(): void {
		xjs.Array.forEachAggregated([this.typenode, this.assigned], (c) => c.varCheck());
		if (this.assignee) {
			if (this.validator.hasSymbol(this.assignee.id)) {
				throw new AssignmentError01(this.assignee);
			}
			this.validator.addSymbol(new SymbolStructureVar(this.assignee, this.unfixed));
		}
	}

	public override typeCheck(): void {
		this.assigned.typeCheck();
		const assignee_type: TYPE.Type = this.typenode.eval();
		try {
			ASTNodeCP.typeCheckAssignment(
				this.assigned.type(),
				assignee_type,
				this,
				this.validator,
			);
		} catch (err) {
			if (!(this.assigned instanceof ASTNodeCollectionLiteral && this.assigned.assignTo(assignee_type))) {
				throw err;
			}
		}
		if (this.assignee) {
			const value: OBJ.Object | null = this.assigned.fold(); // fold first before checking, to rethrow any errors
			assert.ok(this.validator.hasSymbol(this.assignee.id), `The validator symbol table should include ${ this.assignee.id }.`);
			const symbol = this.validator.getSymbolInfo(this.assignee.id) as SymbolStructureVar;
			symbol.type = assignee_type;
			if (this.validator.config.compilerOptions.constantFolding && !symbol.type.hasMutable && !this.unfixed) {
				assert.ok(!symbol.unfixed, `${ symbol } should not be unfixed.`);
				symbol.value = value;
			}
		}
	}

	public override build(builder: Builder): INST.InstructionNone | INST.InstructionDeclareGlobal | INST.InstructionStatement {
		const tofloat: boolean = this.typenode.eval().isSubtypeOf(TYPE.FLOAT) || this.assigned.shouldFloat();
		const value: OBJ.Object | null = this.assigned.fold();
		return (this.assignee)
			? (this.validator.config.compilerOptions.constantFolding && value && !this.unfixed)
				? new INST.InstructionNone()
				: new INST.InstructionDeclareGlobal(this.assignee.id, this.unfixed, this.assigned.build(builder, tofloat))
			: (this.validator.config.compilerOptions.constantFolding && value)
				? new INST.InstructionNone()
				: new INST.InstructionStatement(builder.stmtCount, this.assigned.build(builder, tofloat));
	}
}
