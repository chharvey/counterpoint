import * as assert from 'assert';
import * as xjs from 'extrajs';
import {
	OBJ,
	TYPE,
	INST,
	Builder,
	AssignmentError01,
} from '../../index.js';
import {
	CPConfig,
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
			const symbol: SymbolStructureVar | null = this.validator.getSymbolInfo(this.assignee.id) as SymbolStructureVar | null;
			if (symbol) {
				symbol.type = assignee_type;
				if (this.validator.config.compilerOptions.constantFolding && !symbol.type.hasMutable && !this.unfixed) {
					symbol.value = this.assigned.fold();
				}
			}
		} else {
			throw new Error('blank not yet supported.');
		}
	}

	public override build(builder: Builder): INST.InstructionNone | INST.InstructionDeclareGlobal {
		if (this.assignee) {
			const tofloat: boolean = this.typenode.eval().isSubtypeOf(TYPE.FLOAT) || this.assigned.shouldFloat();
			const value: OBJ.Object | null = this.assignee.fold();
			return (this.validator.config.compilerOptions.constantFolding && !this.unfixed && value)
				? new INST.InstructionNone()
				: new INST.InstructionDeclareGlobal(this.assignee.id, this.unfixed, this.assigned.build(builder, tofloat));
		} else {
			throw new Error('blank not yet supported.');
		}
	}
}
