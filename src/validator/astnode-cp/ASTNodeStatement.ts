import * as assert from 'assert';
import type {
	TYPE,
	INST,
	Builder,
	TypeErrorNotAssignable,
} from '../../index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import {ASTNodeGoal} from './index.js';
import type {Buildable} from './Buildable.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



/**
 * A sematic node representing a statement.
 * Known subclasses:
 * - ASTNodeDeclaration
 * - ASTNodeStatementExpression
 * - ASTNodeAssignment
 */
export abstract class ASTNodeStatement extends ASTNodeCP implements Buildable {
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


	/** @implements Buildable */
	public abstract build(builder: Builder): INST.Instruction;

	/**
	 * Utility method for type-checking assignment.
	 * Attempts to call {@link ASTNodeCP.typeCheckAssignment} first,
	 * but if catching an error, attempts to assign entry-by-entry
	 * if the assigned expression is a variable collection literal.
	 *
	 * We want to be able to assign collection literals to wider mutable types
	 * so that we can mutate them with different values:
	 * ```
	 * let tup: mutable [int] = [42]; % <-- assignment should not fail
	 * set tup.0 = 43;
	 * ```
	 * However, we want this to not be the case for constant collections,
	 * because they aren’t mutable:
	 * ```
	 * let vec: mutable [int] = \[42]; % <-- assignment should fail
	 * ```
	 *
	 * @param  assigned      the expression assigned
	 * @param  assignee_type the type of the assignee (the variable, bound property, or parameter being (re)assigned)
	 * @throws {TypeErrorNotAssignable} if {@link ASTNodeCP.typeCheckAssignment} throws, and:
	 *                       if the assigned expression is not a collection literal,
	 *                       is not a reference object,
	 *                       or is not entry-wise assignable
	 */
	protected typeCheckAssignment(
		assigned:      ASTNodeExpression,
		assignee_type: TYPE.Type,
	): void {
		try {
			return ASTNodeCP.typeCheckAssignment(
				assigned.type(),
				assignee_type,
				this,
				this.validator,
			);
		} catch (err) {
			if (assigned instanceof ASTNodeCollectionLiteral) {
				return assigned.assignTo(assignee_type, err as TypeErrorNotAssignable);
			} else {
				throw err;
			}
		}
	}
}
