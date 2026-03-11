import * as xjs from 'extrajs';
import {runOnceMethod} from '../lib/index.ts';
import {IR} from './index.ts';
import type {Temp} from './utils-private.ts';



/**
 * The Optimizer is responsible for lowering the abstract syntax tree (AST) into a high-level internal representation (IR),
 * taking the form of a control flow graph (CFG). Unlike the AST, which represents syntax structure,
 * the CFG represents execution order. The CFG assumes the AST is already validated.
 */
export class Optimizer {
	#tempCounter:  bigint = 0n;
	#labelCounter: bigint = 0n;

	readonly #instructions: IR.Instruction[] = [];

	public get instructions(): IR.Instruction[] {
		return [...this.#instructions];
	}

	public newTemp(value: IR.Value): Temp {
		const id:    bigint = this.#tempCounter--; // temp ids are negative so as not to conflict with actual variable ids
		const local: Temp   = {
			id,
			value,
			name: `$${ -id }`, // appears positive
			type: value.type,
		};
		this.pushInstruction(new IR.Decl(local, value));
		return local;
	}

	public newLabel(): IR.Label {
		return new IR.Label(`block-${ this.#labelCounter++ }`);
	}

	public pushInstruction(instr: IR.Instruction): void {
		this.#instructions.push(instr);
	}

	@runOnceMethod
	public validate(): void {
		return xjs.Array.forEachAggregated(this.#instructions, (instr) => instr.validate());
	}

	public print(): string {
		return this.#instructions.map((instr) => instr.toString()).join('\n');
	}
}
