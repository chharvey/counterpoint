import {OpCode} from './utils-public.ts';



/**
 * An Instruction to the internal representation (IR).
 *
 * Known subclasses:
 * - Value
 * - Drop
 * - Decl
 * - Set
 * - CollectionDynamicSet
 * - CollectionDynamicCopy
 * - Label
 * - Goto
 * - GotoIfFalse
 */
export abstract class Instruction {
	public constructor(private readonly opCode?: OpCode) {}

	/** Type-validate this Instruction. Throws if invalid. */
	public validate(): void {
		return;
	}

	/** @final */
	protected get opCodeString(): string {
		return this.opCode ? OpCode[this.opCode].replace(/_/, '.') : '';
	}

	/** Represent this Instruction as a string for inspection. */
	public abstract toString(): string;
}
