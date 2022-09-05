import * as assert from 'assert';
import {
	TYPE,
	INST,
	Builder,
	TypeError03,
	CPConfig,
	CONFIG_DEFAULT,
	SymbolStructureVar,
	SyntaxNodeType,
} from './package.js';
import type {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeVariable} from './ASTNodeVariable.js';
import {ASTNodeAccess} from './ASTNodeAccess.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';



export class ASTNodeDeclarationClaim extends ASTNodeStatement {
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeDeclarationClaim {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeDeclarationClaim);
		return statement;
	}
	constructor (
		start_node: SyntaxNodeType<'declaration_claim'>,
		readonly assignee: ASTNodeVariable | ASTNodeAccess,
		readonly claimed_type: ASTNodeType,
	) {
		super(start_node, {}, [assignee, claimed_type]);
	}
	override typeCheck(): void {
		super.typeCheck();
		const claimed_type:  TYPE.Type = this.claimed_type.eval();
		const computed_type: TYPE.Type = this.assignee.type();
		const is_intersection_empty: boolean = claimed_type.intersect(computed_type).equals(TYPE.Type.NEVER);
		const treatIntAsSubtypeOfFloat: boolean = this.validator.config.compilerOptions.intCoercion && (
			   computed_type.isSubtypeOf(TYPE.Type.INT) && TYPE.Type.FLOAT.isSubtypeOf(claimed_type)
			|| claimed_type.isSubtypeOf(TYPE.Type.INT)  && TYPE.Type.FLOAT.isSubtypeOf(computed_type)
			|| TYPE.Type.INT.isSubtypeOf(computed_type) && claimed_type.isSubtypeOf(TYPE.Type.FLOAT)
			|| TYPE.Type.INT.isSubtypeOf(claimed_type)  && computed_type.isSubtypeOf(TYPE.Type.FLOAT)
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
