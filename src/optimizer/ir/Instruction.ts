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
	/** Represent this Instruction as a string for inspection. */
	public abstract toString(): string;
}
