import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	type TYPE,
	TypeErrorNotAssignable,
} from '../../index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SymbolSchemaVar} from '../index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import type {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeVariable} from './ASTNodeVariable.js';
import {ASTNodeAccess} from './ASTNodeAccess.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';



export class ASTNodeDeclarationClaim extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeDeclarationClaim {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeDeclarationClaim);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'declaration_claim'>,
		private readonly assignee: ASTNodeVariable | ASTNodeAccess,
		private readonly claimed_type: ASTNodeType,
	) {
		super(start_node, {}, [assignee, claimed_type]);
	}

	public override typeCheck(): void {
		super.typeCheck();
		const computed_type: TYPE.Type = this.assignee.type();
		const claimed_type:  TYPE.Type = this.claimed_type.eval();
		/* If the types are disjoint and neither of the types are the Bottom Type, throw an error. */
		if (claimed_type.intersect(computed_type).isBottomType && !claimed_type.isBottomType && !computed_type.isBottomType) {
			/*
				`Conversion of type \`${ computed_type }\` to type \`${ claimed_type }\` may be a mistake
				because neither type sufficiently overlaps with the other.
				If this was intentional, convert the expression to \`obj\` first.`;
			*/
			throw new TypeErrorNotAssignable(claimed_type, computed_type, this);
		}
		if (this.assignee instanceof ASTNodeVariable) {
			const symbol: SymbolSchemaVar | null = this.validator.getSymbolInfo(this.assignee.id) as SymbolSchemaVar | null;
			if (symbol) {
				symbol.type = claimed_type;
			}
		} else {
			this.assignee instanceof ASTNodeAccess;
			// TODO
			throw new Error('`ASTNodeDeclarationClaim[assignee: ASTNodeAccess]#typeCheck` not yet supported.');
		}
	}

	public override build(): binaryen.ExpressionRef {
		return this.builder.module.nop();
	}
}
