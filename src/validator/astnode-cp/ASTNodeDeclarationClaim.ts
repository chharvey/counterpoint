import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	TYPE,
	type Builder,
	TypeErrorNotAssignable,
} from '../../index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SymbolStructureVar} from '../index.js';
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
		const claimed_type:  TYPE.Type = this.claimed_type.eval();
		const computed_type: TYPE.Type = this.assignee.type();
		const is_intersection_empty: boolean = claimed_type.intersect(computed_type).equals(TYPE.NEVER);
		const treatIntAsSubtypeOfFloat: boolean = this.validator.config.compilerOptions.intCoercion && (
			   computed_type.isSubtypeOf(TYPE.INT) && TYPE.FLOAT.isSubtypeOf(claimed_type)
			|| claimed_type.isSubtypeOf(TYPE.INT)  && TYPE.FLOAT.isSubtypeOf(computed_type)
			|| TYPE.INT.isSubtypeOf(computed_type) && claimed_type.isSubtypeOf(TYPE.FLOAT)
			|| TYPE.INT.isSubtypeOf(claimed_type)  && computed_type.isSubtypeOf(TYPE.FLOAT)
		);
		if (is_intersection_empty && !treatIntAsSubtypeOfFloat) {
			/*
				`Conversion of type \`${ computed_type }\` to type \`${ claimed_type }\` may be a mistake
				because neither type sufficiently overlaps with the other. If this was intentional,
				convert the expression to \`obj\` first.`;
			*/
			throw new TypeErrorNotAssignable(claimed_type, computed_type, this);
		}
		if (this.assignee instanceof ASTNodeVariable) {
			const symbol: SymbolStructureVar | null = this.validator.getSymbolInfo(this.assignee.id) as SymbolStructureVar | null;
			if (symbol) {
				symbol.type = claimed_type;
			}
		} else {
			this.assignee instanceof ASTNodeAccess;
			// TODO
			throw '`ASTNodeDeclarationClaim[assignee: ASTNodeAccess]#typeCheck` not yet supported.';
		}
	}

	public override build(builder: Builder): binaryen.ExpressionRef {
		return builder.module.nop();
	}
}
