import * as assert from 'assert';
import type binaryen from 'binaryen';
import {BinVect} from '../../index.js';
import {
	SolidType,
	Builder,
	SolidConfig,
	CONFIG_DEFAULT,
} from './package.js';
import {ASTNodeGoal} from './index.js';
import type {Buildable} from './Buildable.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';



/**
 * A sematic node representing a statement.
 * Known subclasses:
 * - ASTNodeStatementExpression
 * - ASTNodeDeclaration
 * - ASTNodeAssignment
 */
export abstract class ASTNodeStatement extends ASTNodeSolid implements Buildable {
	/**
	 * Construct a new ASTNodeStatement from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeStatement representing the given source
	 */
	static fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeStatement {
		const goal: ASTNodeGoal = ASTNodeGoal.fromSource(src, config);
		assert.strictEqual(goal.children.length, 1, 'semantic goal should have 1 child');
		return goal.children[0];
	}

	protected static coerceAssignment(
		mod:           binaryen.Module,
		assignee_type: SolidType,
		assigned_type: SolidType,
		value:         binaryen.ExpressionRef,
		int_coercion:  boolean = true,
	): binaryen.ExpressionRef {
		if ( // TODO: remove this; we only want to allow assigning ints to floats if they have been explicitly coerced/casted first
			   int_coercion
			&& assigned_type.isSubtypeOf(SolidType.INT)
			&& SolidType.FLOAT.isSubtypeOf(assignee_type)
			&& !SolidType.INT.isSubtypeOf(assignee_type)
		) {
			return new BinVect(mod, mod.f64.convert_u.i32(value)).vect;
		}
		return value;
	}


	/** @implements Buildable */
	abstract build(builder: Builder): binaryen.ExpressionRef;
}
