import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	SolidType,
	SolidTypeUnion,
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
		if (
			   int_coercion
			&& assignee_type.binType() === binaryen.f64
			&& assigned_type.binType() === binaryen.i32
		) {
			value = mod.f64.convert_u.i32(value);
		}
		return (assigned_type instanceof SolidTypeUnion)
			// assert: `value` is equivalent to a result of `Builder.createBinEither()`
			? mod.if(
				mod.i32.eqz(mod.tuple.extract(value, 1)),
				ASTNodeStatement.coerceAssignment(mod, assignee_type, assigned_type.left,  mod.tuple.extract(value, 2), int_coercion),
				ASTNodeStatement.coerceAssignment(mod, assignee_type, assigned_type.right, mod.tuple.extract(value, 3), int_coercion),
			)
			: (assignee_type instanceof SolidTypeUnion)
				? (
					(assigned_type.isSubtypeOf(assignee_type.left)) ? Builder.createBinEither(mod, 0n, [
						(assigned_type.binType() === assignee_type.left.binType())
							? value
							: ASTNodeStatement.coerceAssignment(mod, assignee_type.left, assigned_type, value, int_coercion),
						assignee_type.right.defaultBinValue(mod),
					]) :
					(assigned_type.isSubtypeOf(assignee_type.right)) ? Builder.createBinEither(mod, 1n, [
						assignee_type.left.defaultBinValue(mod),
						(assigned_type.binType() === assignee_type.right.binType())
							? value
							: ASTNodeStatement.coerceAssignment(mod, assignee_type.right, assigned_type, value, int_coercion),
					]) :
					(() => { throw new TypeError(`Expected \`${ assigned_type }\` to be a subtype of \`${ assignee_type.left }\` or \`${ assignee_type.right }\``); })() // TODO: use throw_expression
				)
				: value;
	}


	/** @implements Buildable */
	abstract build(builder: Builder): binaryen.ExpressionRef;
}
