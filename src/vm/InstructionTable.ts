import type {
	Opcode,
} from './utils-private.js';



/**
 * An Instruction to the virtual machine.
 * @see https://dev.to/jimsy/building-a-stack-based-virtual-machine-part-3---instructions-4b3a
 */
export type Instruction = {
	/** A unique identifying number for this Instruction. */
	readonly opcode: Opcode,
	/** Readable name for this Instruction. */
	readonly name: string,
	/** Number of arguments this Instruction takes. */
	readonly arity: bigint,
	/** The action that this Instruction will perform. */
	readonly action: (machine: unknown, args: unknown[]) => void,
};



/**
 * A catalog of instructions for the virtual machine.
 */
export class InstructionTable {
	/** Internal implemenation of this InstructionTable’s data. */
	private readonly map: Map<Opcode, Instruction> = new Map();

	/**
	 * Construct a new InstructionTable object.
	 */
	constructor () {
	}

	/**
	 * Is this InstructionTable empty?
	 * @return `true` if this InstructionTable contains no items
	 */
	get isEmpty(): boolean {
		return this.map.size === 0;
	}

	/**
	 * Get an Instruction by opcode.
	 * @param  opcode the opcode of the Instruction to get
	 * @return        the Instruction with the given opcode, or `null`
	 */
	getByOpcode(opcode: Opcode): Instruction | null {
		return this.map.get(opcode) || null;
	}

	/**
	 * Get an Instruction by name.
	 * @param  name the name of the Instruction to get
	 * @return      the Instruction with the given name, or `null`
	 */
	getByName(name: string): Instruction | null {
		return [...this.map.values()].find((inst) => inst.name === name) || null;
	}

	/**
	 * Returns a list of symbols for use in the `Code` struct.
	 * @return a list of pairs of opcode and name of each instruction in this InstructionTable
	 */
	getSymbols(): Map<Opcode, string> {
		return new Map([...this.map.values()].map((instr) => [instr.opcode, instr.name])); // using `instr.opcode` instead of map keys for robustness
	}

	/**
	 * Add an Instruction to this InstructionTable.
	 * @param  instruction the Instruction to add
	 * @return             `this`
	 */
	add(instruction: Instruction): this {
		this.map.set(instruction.opcode, instruction);
		return this;
	}
}
