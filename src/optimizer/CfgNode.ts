import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {runOnceMethod} from '../lib/index.ts';
import type {IR} from './index.ts';



/**
 * A node in a control-flow graph (CFG).
 * Also known as a “block” (but not the same as a “statement block”).
 */
export class CfgNode {
	readonly #instructions: IR.Instruction[] = [];

	#terminator?: IR.Terminator;

	public constructor(private readonly label: string) {}

	public get instructions(): IR.Instruction[] {
		return [...this.#instructions];
	}

	public toString(): string {
		return [
			`"${ this.label }":`,
			...this.#instructions.map((instr) => instr.toString()),
			...(this.#terminator ? [this.#terminator.toString()] : []),
		].join('\n\t');
	}

	public pushInstruction(instr: IR.Instruction): void {
		if (this.#terminator) {
			throw new Error('Unreachable instruction.');
		}
		this.#instructions.push(instr);
	}

	public terminate(term: IR.Terminator): void {
		assert.ok(!this.#terminator, 'Block should not already be terminated.');
		this.#terminator = term;
	}

	@runOnceMethod
	public validate(): void {
		xjs.Array.forEachAggregated(this.#instructions, (instr) => instr.validate());

		assert.ok(this.#terminator, 'Block should already be terminated.');
		return this.#terminator.validate();
	}
}
