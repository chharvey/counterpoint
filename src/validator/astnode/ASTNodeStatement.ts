import * as assert from 'assert';
import {
	TypeError03,
	SolidConfig,
	CONFIG_DEFAULT,
	SolidType,
	Int16,
	Float64,
	Instruction,
	Builder,
	Validator,
} from './package.js';
import {ASTNodeGoal} from './index.js';
import type {Buildable} from './Buildable.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';



/**
 * A sematic node representing a statement.
 * There are 3 known subclasses:
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
	abstract build(builder: Builder): Instruction;
	/**
	 * Type-check an assignment.
	 * @final
	 * @param assignee_type the type of the assignee (the variable or bound property being reassigned)
	 * @param assigned_type the type of the expression assigned
	 * @param validator     a validator
	 * @throws {TypeError03} if the assigned expression is not assignable to the assignee
	 */
	protected typeCheckAssignment(assignee_type: SolidType, assigned_type: SolidType, validator: Validator): void {
		const treatIntAsSubtypeOfFloat: boolean = (
			   validator.config.compilerOptions.intCoercion
			&& assigned_type.isSubtypeOf(Int16)
			&& Float64.isSubtypeOf(assignee_type)
		);
		if (!assigned_type.isSubtypeOf(assignee_type) && !treatIntAsSubtypeOfFloat) {
			throw new TypeError03(this, assignee_type, assigned_type);
		}
	}
}
