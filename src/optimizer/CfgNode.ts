import type {IR} from './index.ts';



/**
 * A node in a control-flow graph (CFG).
 * Also known as a “block” (but not the same as a “statement block”).
 */
export class CfgNode {
	readonly #instructions: IR.Instruction[] = [];

	public terminator?: IR.Instruction;

	public constructor(private readonly label: string) {}

	public get instructions(): IR.Instruction[] {
		return [...this.#instructions];
	}

	public toString(): string {
		return [
			`"${ this.label }":`,
			...this.#instructions.map((instr) => instr.toString()),
		].join('\n\t');
	}

	public pushInstruction(instr: IR.Instruction): void {
		this.#instructions.push(instr);
	}
}
