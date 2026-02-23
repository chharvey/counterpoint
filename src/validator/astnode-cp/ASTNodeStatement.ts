import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import {
	TYPE,
	type Optimizer,
	type Lowerable,
	BinVect,
} from '../../index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {ASTNodeGoal} from './index.ts';
import type {Buildable} from './Buildable.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';



/**
 * A sematic node representing a statement.
 * Known subclasses:
 * - ASTNodeDeclaration
 * - ASTNodeStatementExpression
 * - ASTNodeAssignment
 */
export abstract class ASTNodeStatement extends ASTNodeCP implements Lowerable, Buildable {
	/**
	 * Construct a new ASTNodeStatement from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeStatement representing the given source
	 */
	public static fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeStatement {
		const goal: ASTNodeGoal = ASTNodeGoal.fromSource(src, config);
		assert.strictEqual(goal.children.length, 1, 'semantic goal should have 1 child');
		return goal.children[0];
	}

	protected static coerceAssignment(
		mod:           binaryen.Module,
		assignee_type: TYPE.Type,
		assigned_type: TYPE.Type,
		value:         binaryen.ExpressionRef,
		int_coercion:  boolean = true,
	): binaryen.ExpressionRef {
		if ( // TODO: remove this; we only want to allow assigning ints to floats if they have been explicitly coerced/casted first
			int_coercion &&
			assigned_type.isSubtypeOf(TYPE.INT) &&
			TYPE.FLOAT.isSubtypeOf(assignee_type) &&
			!TYPE.INT.isSubtypeOf(assignee_type)
		) {
			return new BinVect(mod, mod.f64.convert_u.i32(value)).vect;
		}
		return value;
	}

	/**
	 * @inheritdoc
	 * @implements Lowerable
	 */
	public abstract lower(optimizer: Optimizer): void;

	/**
	 * @inheritdoc
	 * @implements Buildable
	 */
	public abstract build(): binaryen.ExpressionRef;
}
