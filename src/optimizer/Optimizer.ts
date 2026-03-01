import {IR} from './index.ts';
import type {Local} from './utils-public.ts';



/**
 * The Optimizer is responsible for lowering the abstract syntax tree (AST) into a high-level internal representation (IR),
 * taking the form of a control flow graph (CFG). Unlike the AST, which represents syntax structure,
 * the CFG represents execution order. The CFG assumes the AST is already validated.
 */
export class Optimizer {
	#tempLocalCounter: bigint = 0n;
	#labelCounter:     bigint = 0n;

	readonly #instructions: IR.Instruction[] = [];

	public get instructions(): IR.Instruction[] {
		return [...this.#instructions];
	}

	public newTempLocal(type_or_value: IR.TypeName | IR.Value): Local {
		const local: Local = {
			name: `$${ this.#tempLocalCounter++ }`,
			type: type_or_value instanceof IR.Value ? type_or_value.type : type_or_value,
		};
		this.pushInstruction(new IR.Decl(local));
		if (type_or_value instanceof IR.Value) {
			this.pushInstruction(new IR.Set(local, type_or_value));
		}
		return local;
	}

	public newLabel(): string {
		return `block-${ this.#labelCounter++ }`;
	}

	public pushInstruction(instr: IR.Instruction): void {
		this.#instructions.push(instr);
	}

	public print(): string {
		return this.#instructions.map((instr) => instr.toString()).join('\n');
	}
}
