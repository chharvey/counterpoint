/**
 * An node in to the internal representation (IR).
 *
 * Known subclasses:
 * - Value
 * - Instruction
 */
export abstract class IrNode {
	/** Type-validate this node. Throws if invalid. */
	public validate(): void {
		return;
	}

	/** Represent this node as a string for inspection. */
	public abstract toString(): string;
}
