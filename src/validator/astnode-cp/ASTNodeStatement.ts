import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	TYPE,
	Builder,
} from '../../index.js';
import {throw_expression} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import {ASTNodeGoal} from './index.js';
import type {Buildable} from './Buildable.js';
import {ASTNodeCP} from './ASTNodeCP.js';



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

	protected static coerceAssignment(
		mod:           binaryen.Module,
		assignee_type: TYPE.Type,
		assigned_type: TYPE.Type,
		value:         binaryen.ExpressionRef,
		int_coercion:  boolean = true,
	): binaryen.ExpressionRef {
		if (
			   int_coercion
			&& assignee_type.binType() === binaryen.f64
			&& assigned_type.binType() === binaryen.i32
		) {
			value = mod.f64.convert_u.i32(value);
		}
		if (assigned_type instanceof TYPE.TypeUnion) {
			// assert: `value` is equivalent to a result of `Builder.createBinEither()`
			return mod.if(
				mod.i32.eqz(mod.tuple.extract(value, 0)),
				ASTNodeStatement.coerceAssignment(mod, assignee_type, assigned_type.left,  mod.tuple.extract(value, 1), int_coercion),
				ASTNodeStatement.coerceAssignment(mod, assignee_type, assigned_type.right, mod.tuple.extract(value, 2), int_coercion),
			);
		}
		if (assignee_type instanceof TYPE.TypeUnion) {
			const [side, left, right]: [boolean, binaryen.ExpressionRef, binaryen.ExpressionRef] = (
				(assigned_type.isSubtypeOf(assignee_type.left)) ? [
					false,
					(assigned_type.binType() === assignee_type.left.binType())
						? value
						: ASTNodeStatement.coerceAssignment(mod, assignee_type.left, assigned_type, value, int_coercion),
					assignee_type.right.defaultBinValue(mod),
				] :
				(assigned_type.isSubtypeOf(assignee_type.right)) ? [
					true,
					assignee_type.left.defaultBinValue(mod),
					(assigned_type.binType() === assignee_type.right.binType())
						? value
						: ASTNodeStatement.coerceAssignment(mod, assignee_type.right, assigned_type, value, int_coercion),
				] :
				throw_expression(new TypeError(`Expected \`${ assigned_type }\` to be a subtype of \`${ assignee_type.left }\` or \`${ assignee_type.right }\``))
			);
			return Builder.createBinEither(mod, side, left, right);
		}
		return value;
	}


	/** @implements Buildable */
	public abstract build(builder: Builder): binaryen.ExpressionRef;
}
