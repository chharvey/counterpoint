/**
 * An Instruction to the internal representation (IR).
 *
 * Known subclasses:
 * - Value
 * - Drop
 * - Decl
 * - Set
 * - CollectionDynamicSet
 * - Label
 * - Goto
 * - GotoIfFalse
 */
export abstract class Instruction {
	/** Type-validate this Instruction. Throws if invalid. */
	public validate(): void {
		return;
	}

	/** Represent this Instruction as a string for inspection. */
	public abstract toString(): string;
}
