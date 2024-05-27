import * as assert from 'assert';
import binaryen from 'binaryen';
import {BinVect} from '../../index.js';
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
		return (assignee_type instanceof SolidTypeUnion && !(assigned_type instanceof SolidTypeUnion))
			? (assert.strictEqual(assignee_type.binType(), binaryen.v128), new BinVect(mod, value).vect)
			: value;
	}


	/** @implements Buildable */
	abstract build(builder: Builder): binaryen.ExpressionRef;
}
