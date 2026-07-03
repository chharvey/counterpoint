import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {TYPE} from '../../../typer/index.ts';
import {STMT} from '../index.ts';
import {AstNode} from '../AstNode.ts';



/**
 * A sematic node representing a type expression.
 * Known subclasses:
 * - Constant
 * - TypeAlias
 * - Collection
 * - Access
 * - Call
 * - Operation
 * - TypeFunction
 */
export abstract class Type extends AstNode {
	/**
	 * Construct a new Type from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new Type representing the given source
	 */
	public static fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Type {
		const statement: STMT.DeclarationType = STMT.DeclarationType.fromSource(`type T = ${ src };`, config);
		return statement.assigned;
	}

	/**
	 * @final
	 */
	public override typeCheck(): void {
		super.typeCheck();
		this.eval(); // assert does not throw
	}

	/**
	 * Assess the type-value of this node at compile-time.
	 * @returns the computed type-value of this node
	 */
	public abstract eval(): TYPE.Type;
}
