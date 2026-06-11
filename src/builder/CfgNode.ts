import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import type {CodeGenerator} from '../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../lib/index.ts';
import type {OP} from './index.ts';
import type {Builder} from './Builder.ts';
import type {Interpreter} from './Interpreter.ts';



/**
 * A node in a control-flow graph (CFG).
 * Also known as a “block” (but not the same as a “statement block”).
 */
export class CfgNode {
	readonly #instructions: OP.Instruction[] = [];

	#terminator?: OP.Terminator;

	public constructor(public readonly label: string) {}

	public get instructions(): OP.Instruction[] {
		return [...this.#instructions];
	}

	public get terminator(): OP.Terminator | undefined {
		return this.#terminator;
	}

	public toString(): string {
		return [
			`"${ this.label }":`,
			...this.#instructions.map((instr) => instr.toString()),
			...(this.#terminator ? [this.#terminator.toString()] : []),
		].join('\n\t');
	}

	public pushInstruction(instr: OP.Instruction): void {
		if (this.#terminator) {
			throw new Error('Unreachable instruction.');
		}
		this.#instructions.push(instr);
	}

	public terminate(term: OP.Terminator): void {
		assert.ok(!this.#terminator, 'Block should not already be terminated.');
		this.#terminator    = term;
		term.containerLabel = this.label;
	}

	@runOnceMethod
	public validate(builder: Builder): void {
		xjs.Array.forEachAggregated(this.#instructions, (instr) => instr.validate(builder));

		assert.ok(this.#terminator, 'Block should already be terminated.');
		return this.#terminator.validate(builder);
	}

	public interpret(interp: Interpreter): void {
		this.#instructions.forEach((instr) => instr.interpret(interp));
		return this.#terminator!.interpret(interp);
	}

	@memoizeMethod
	public codegen(cg: CodeGenerator, relooper: binaryen.Relooper): binaryen.RelooperBlockRef {
		return relooper.addBlock(cg.mod.block(this.label, this.#instructions.map((instr) => instr.codegen(cg)))); // leaving off terminator for branching later
	}
}
