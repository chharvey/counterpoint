import type {Opcode} from './utils-private.ts';
import type {Machine} from './Machine.ts';



/**
 * An Instruction to the virtual machine.
 * @typeparam T the type of items in an operand {@link Stack}
 * @see https://dev.to/jimsy/building-a-stack-based-virtual-machine-part-3---instructions-4b3a
 */
export type VmInstruction<T> = {
	/** A unique identifying number for this Instruction. */
	readonly opcode: Opcode,
	/** Readable name for this Instruction. */
	readonly name:   string,
	/** Number of arguments this Instruction takes. */
	readonly arity:  bigint,
	/** The action that this Instruction will perform. */
	readonly action: (machine: Machine<T>, args: bigint[]) => void,
};



/**
 * A catalog of instructions for the virtual machine.
 * @typeparam T the type of items in an operand {@link Stack}
 */
export class InstructionTable<T> {
	/** Internal implemenation of this InstructionTable’s data. */
	private readonly map = new Map<Opcode, VmInstruction<T>>();

	/**
	 * Is this InstructionTable empty?
	 * @return `true` if this InstructionTable contains no items
	 */
	public get isEmpty(): boolean {
		return this.map.size === 0;
	}

	/**
	 * Get an Instruction by opcode.
	 * @param  opcode the opcode of the Instruction to get
	 * @return        the Instruction with the given opcode, or `null`
	 */
	public getByOpcode(opcode: Opcode): VmInstruction<T> | null {
		return this.map.get(opcode) ?? null;
	}

	/**
	 * Get an Instruction by name.
	 * @param  name the name of the Instruction to get
	 * @return      the Instruction with the given name, or `null`
	 */
	public getByName(name: string): VmInstruction<T> | null {
		return [...this.map.values()].find((inst) => inst.name === name) ?? null;
	}

	/**
	 * Returns a list of symbols for use in the `Code` struct.
	 * @return a list of pairs of opcode and name of each instruction in this InstructionTable
	 */
	public getSymbols(): Map<Opcode, string> {
		return new Map([...this.map.values()].map((instr) => [instr.opcode, instr.name])); // using `instr.opcode` instead of map keys for robustness
	}

	/**
	 * Add an Instruction to this InstructionTable.
	 * @param  instruction the Instruction to add
	 * @return             `this`
	 */
	public add(instruction: VmInstruction<T>): this {
		this.map.set(instruction.opcode, instruction);
		return this;
	}
}
