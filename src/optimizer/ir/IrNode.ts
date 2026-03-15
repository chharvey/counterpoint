import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';



/**
 * An node in to the internal representation (IR).
 *
 * Known subclasses:
 * - Value
 * - Instruction
 */
export abstract class IrNode {
	/** Represent this node as a string for inspection. */
	public abstract toString(): string;

	/** Type-validate this node. Throws if invalid. */
	public validate(): void {
		return;
	}

	/**
	 * Generate assembly code.
	 * @param  cg code-generator
	 * @return    a binaryen expression of type `(ref $Value)`
	 */
	public abstract codegen(cg: Builder): binaryen.ExpressionRef;
}
