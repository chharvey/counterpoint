import type {CFG} from './index.ts';



/**
 * The Optimizer is responsible for lowering the abstract syntax tree (AST) into a high-level internal representation (IR),
 * taking the form of a control flow graph (CFG). Unlike the AST, which represents syntax structure,
 * the CFG represents execution order. The CFG assumes the AST is already validated.
 */
export class Optimizer {
	readonly #instructions: CFG.Instruction[] = [];

	public get instructions(): CFG.Instruction[] {
		return [...this.#instructions];
	}

	public pushInstruction(instr: CFG.Instruction): void {
		this.#instructions.push(instr);
	}

	public print(): string {
		return this.#instructions.map((instr) => instr.toString()).join('\n');
	}
}
