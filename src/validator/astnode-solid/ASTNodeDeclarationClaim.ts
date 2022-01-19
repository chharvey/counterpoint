import * as assert from 'assert';
import {
	SolidType,
	INST,
	Builder,
	TypeError03,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	SymbolStructureVar,
} from './package.js';
import type {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeVariable} from './ASTNodeVariable.js';
import {ASTNodeAccess} from './ASTNodeAccess.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';



export class ASTNodeDeclarationClaim extends ASTNodeStatement {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeDeclarationClaim {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeDeclarationClaim);
		return statement;
	}
	constructor (
		start_node: ParseNode,
		readonly assignee: ASTNodeVariable | ASTNodeAccess,
		readonly claimed_type: ASTNodeType,
	) {
		super(start_node, {}, [assignee, claimed_type]);
	}
	override typeCheck(): void {
		super.typeCheck();
		const claimed_type:  SolidType = this.claimed_type.eval();
		const computed_type: SolidType = this.assignee.type();
		const is_intersection_empty: boolean = claimed_type.intersect(computed_type).equals(SolidType.NEVER);
		const treatIntAsSubtypeOfFloat: boolean = this.validator.config.compilerOptions.intCoercion && (
			   computed_type.isSubtypeOf(SolidType.INT) && SolidType.FLOAT.isSubtypeOf(claimed_type)
			|| claimed_type.isSubtypeOf(SolidType.INT)  && SolidType.FLOAT.isSubtypeOf(computed_type)
			|| SolidType.INT.isSubtypeOf(computed_type) && claimed_type.isSubtypeOf(SolidType.FLOAT)
			|| SolidType.INT.isSubtypeOf(claimed_type)  && computed_type.isSubtypeOf(SolidType.FLOAT)
		);
		if (is_intersection_empty && !treatIntAsSubtypeOfFloat) {
			/*
				`Conversion of type \`${ computed_type }\` to type \`${ claimed_type }\` may be a mistake
				because neither type sufficiently overlaps with the other. If this was intentional,
				convert the expression to \`obj\` first.`;
			*/
			throw new TypeError03(claimed_type, computed_type, this);
		}
		if (this.assignee instanceof ASTNodeVariable) {
			const symbol: SymbolStructureVar | null = this.validator.getSymbolInfo(this.assignee.id) as SymbolStructureVar | null;
			if (symbol) {
				symbol.type = claimed_type;
			}
		} else {
			this.assignee instanceof ASTNodeAccess;
			// TODO
			throw '`ASTNodeDeclarationClaim[assignee: ASTNodeAccess]#typeCheck` not yet supported.'
		}
	}
	override build(_builder: Builder): INST.InstructionNone {
		return new INST.InstructionNone();
	}
}