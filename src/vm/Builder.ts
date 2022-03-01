import type {
	Opcode,
} from './utils-private.js';
import type {
	Instruction,
	InstructionTable,
} from './InstructionTable.js';



/**
 * A model for an assembly program that can be run.
 * @typeparam T the type of items in an operand {@link Stack}
 * @see https://dev.to/jimsy/building-a-stack-based-virtual-machine-part-4---code-3lmi
 */
type Code<T> = {
	/** A list of constant operands. */
	readonly data: readonly T[],
	/** A list of instruction opcodes and indexes into the data section. */
	readonly code: readonly Opcode[],
	/** A mapping of labels to instruction pointers (or indexes into the program section). */
	readonly labels: ReadonlyMap<Opcode, string>,
	/** A list of instruction names (symbols) stored by opcode for easier debugging. */
	readonly symbols: ReadonlyMap<Opcode, string>,
};



/**
 * An assembly code generator.
 * @typeparam T the type of items in an operand {@link Stack}
 */
export class Builder<T> {
	/** A list of constant operands. */
	private readonly _data: T[] = [];

	/** A mapping of labels to instruction pointers (or indexes into the program section). */
	private readonly _labels: Record<string, Opcode> = {
		main: 0n,
	};

	/** A list of instruction names (symbols) stored by op code for easier debugging. */
	private readonly _instructions: Opcode[] = [];

	/**
	 * Construct a new Builder object.
	 * @param instruction_table Gives access to labels, opcodes and instruction arities.
	 */
	constructor (
		private readonly instruction_table: InstructionTable<T>,
	) {
	}

	/** A list of constant operands. */
	get data(): readonly T[] {
		return [...this._data];
	}

	/** A mapping of labels to instruction pointers (or indexes into the program section). */
	get labels(): Readonly<Record<string, Opcode>> {
		return {...this._labels};
	}

	/** A list of instruction names (symbols) stored by op code for easier debugging. */
	get instructions(): readonly Opcode[] {
		return [...this._instructions];
	}

	/**
	 * Push an instruction to the program code.
	 * @param name the name of the instruction to add
	 * @param args the arguments to the instruction
	 */
	push(name: string, args: T[]): void {
		// Look up the instruction in the instruction table.
		const instr: Instruction<T> | null = this.instruction_table.getByName(name);
		if (!instr) {
			throw new Error(`Unable to find instruction with name \`${ name }\`.`);
		}
		// Verify that the number of arguments we’ve been given and the instruction arity match.
		if (BigInt(args.length) !== instr.arity) {
			throw new Error(`Instruction \`${ instr.name }\` has arity of ${ instr.arity }, but you provided ${ args.length } arguments.`);
		}
		// Push the instruction’s opcode into the program.
		this._instructions.push(instr.opcode);
		// Push the instruction’s arity into the program. This might seem like it’s not necessary but is needed for the `Code` type to be independent of the `InstructionTable`.
		this._instructions.push(instr.arity);
		// Push each argument into the data section and push its index into the program.
		args.forEach((arg) => {
			this._instructions.push(BigInt((this._data.includes(arg))
				? this._data.indexOf(arg)
				: this._data.push(arg) - 1
			));
		});
	}

	/**
	 * Look up the number of instructions currently in the program and store the name pointing to it.
	 * @param name the name to give the new label
	 */
	label(name: string): void {
		this._labels[name] = BigInt(this._instructions.length);
	}

	/**
	 * Convert this Builder into a `Code` object.
	 * @return a `Code` object
	 */
	toCode(): Code<T> {
		return {
			data:    this.data,
			code:    this.instructions,
			labels:  new Map(Object.entries(this._labels).map<[Opcode, string]>(([name, opcode]) => [opcode, name])),
			symbols: this.instruction_table.getSymbols(),
		};
	}
}
