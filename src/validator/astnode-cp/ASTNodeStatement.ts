import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	TYPE,
	Builder,
} from '../../index.js';
import {
	CPConfig,
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
		if (assignee_type instanceof TYPE.TypeUnion) { // `assignee_type.binType()` is a result of calling `binaryen.createType()`
			// create an `Either<L, R>` monad-like thing
			let side:    boolean                = false;
			let left:    binaryen.ExpressionRef = assignee_type.left  .defaultBinValue(mod);
			let right:   binaryen.ExpressionRef = assignee_type.right .defaultBinValue(mod);
			if (assigned_type.isSubtypeOf(assignee_type.left)) {
				[side, left] = [false, value];
			} else if (assigned_type.isSubtypeOf(assignee_type.right)) {
				[side, right] = [true, value];
			} else {
				throw new TypeError(`Expected \`${ assigned_type }\` to be a subtype of \`${ assignee_type.left }\` or \`${ assignee_type.right }\``);
			}
			value = Builder.createBinEither(mod, side, left, right);
		}
		return value;
	}


	/** @implements Buildable */
	public abstract build(builder: Builder): binaryen.ExpressionRef;
}
