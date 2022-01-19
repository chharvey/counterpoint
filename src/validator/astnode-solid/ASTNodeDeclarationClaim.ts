import * as assert from 'assert';
import {
	INST,
	Builder,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
} from './package.js';
import type {ASTNodeType} from './ASTNodeType.js';
import type {ASTNodeVariable} from './ASTNodeVariable.js';
import type {ASTNodeAccess} from './ASTNodeAccess.js';
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
	override varCheck(): void {
		throw 'ASTNodeDeclarationClaim#varCheck not yet supported';
	}
	override typeCheck(): void {
		throw 'ASTNodeDeclarationClaim#typeCheck not yet supported';
	}
	override build(_builder: Builder): INST.InstructionNone {
		throw 'ASTNodeDeclarationClaim#build not yet supported';
	}
}
