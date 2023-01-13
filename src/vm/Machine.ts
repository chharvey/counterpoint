import type {Opcode} from './utils-private.js';
import {Stack} from './Stack.js';
import type {
	Instruction,
	InstructionTable,
} from './InstructionTable.js';
import type {Code} from './Builder.js';



/**
 * A function call stack frame.
 * @see https://dev.to/jimsy/building-a-stack-based-virtual-machine-part-6---function-calls-2md5
 */
type Frame = {readonly returnAddress: bigint};



/**
 * Assmbles the constituent parts into a greater whole.
 * @see https://dev.to/jimsy/building-a-stack-based-virtual-machine-part-5---the-machine-3jif
 */
export class Machine<T> {
	/** Pointer to current instruction. */
	private instruction_pointer: bigint = 0n;
	/** Operand stack. */
	private readonly operand_stack = new Stack<T>();
	/** Call stack. */
	private readonly call_stack = new Stack<Frame>();

	/**
	 * Construct a new Machine object.
	 * @param code              Code for program to be run.
	 * @param instruction_table Gives access to labels, opcodes and instruction arities.
	 */
	constructor(
		private readonly code: Code<T>,
		private readonly instruction_table: InstructionTable<T>,
	) {
		this.call_stack.push({returnAddress: BigInt(this.code.code.length)});
	}

	/**
	 * Push an operand to the operand stack.
	 * @param  value the operand to push
	 * @return       `this`
	 */
	operandPush(value: T): this {
		this.operand_stack.push(value);
		return this;
	}

	/**
	 * Pop an operand from the operand stack.
	 * @return the popped operand
	 */
	operandPop(): T {
		return this.operand_stack.pop()[1];
	}

	/**
	 * Get an operand at the specified index in code.
	 * @param  index the index of the operand to get
	 * @return       the operand at the given index
	 */
	getData(index: bigint): T {
		return this.code.data[Number(index)] ?? (() => {
			// TODO use `throw_expression`
			throw new Error(`Constant data is not present at index ${ index }.`);
		})();
	}

	/**
	 * Call a function given its label.
	 * @param  label the label of the function to call
	 * @return       `this`
	 */
	call(label: string): this {
		this.call_stack.push({returnAddress: this.instruction_pointer});
		this.jump(label);
		return this;
	}

	/**
	 * Return from a called function.
	 * @return `this`
	 */
	return(): this {
		this.instruction_pointer = this.call_stack.pop()[1].returnAddress;
		return this;
	}

	/**
	 * Main run function.
	 */
	run(): void {
		// keep looping until we’ve run out of program
		while (this.instruction_pointer < this.code.code.length) {
			// read the current opcode and arity
			const [opcode, arity]: [Opcode, bigint] = [this.nextCode(), this.nextCode()];
			const instr: Instruction<T> | null = this.instruction_table.getByOpcode(opcode);
			if (!instr) {
				throw new Error(`Unable to find instruction with opcode ${ opcode }`);
			}
			// from 0 to arity, read argument indexes from the program and push them into an arguments vector
			const args: Opcode[] = [];
			[...new Array(Number(arity)).entries()].forEach(() => {
				args.push(this.nextCode());
			});
			// call the instruction with the arguments
			instr.action.call(null, this, args);
		}
	}

	/**
	 * Jump to the given label.
	 * @param  label the label to jump to
	 * @return       `this`
	 */
	private jump(label: string): this {
		this.instruction_pointer = [...this.code.labels].find((entry) => entry[1] === label)?.[0] ?? (() => {
			// TODO use `throw_expression`
			throw new Error(`Attempted to jump to unknown label ${ label }`);
		})();
		return this;
	}

	/**
	 * Retrieve the next opcode and increment the current instruction pointer.
	 * @return the next opcode
	 */
	private nextCode(): Opcode {
		const opcode: Opcode = this.code.code[Number(this.instruction_pointer)];
		this.instruction_pointer += 1n;
		return opcode;
	}
}
