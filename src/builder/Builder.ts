import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import type {CodeGenerator} from '../index.ts';
import {runOnceMethod} from '../lib/index.ts';
import type {TYPE} from '../typer/index.ts';
import {CfgNode} from './CfgNode.ts';
import {OP} from './index.ts';



export type Temp = {
	readonly id:     bigint,
	readonly name:   string,
	readonly type:   TYPE.Type,
	readonly value?: OP.Value,
};



/**
 * The Builder is responsible for converting an abstract syntax tree (AST) into a high-level internal representation (IR),
 * taking the form of a control flow graph (CFG). Unlike the AST, which represents syntax structure,
 * the CFG represents execution order. The CFG assumes the AST is already validated.
 */
export class Builder {
	#tempCounter:  bigint = 0n;
	#labelCounter: bigint = 0n;

	private currentBlock?: CfgNode = new CfgNode(this.newLabel());

	readonly #blocks = new Map<string, CfgNode>();


	public get instructions(): OP.Instruction[] {
		return [...this.#blocks.values()].flatMap((block) => block.instructions).concat(this.currentBlock?.instructions ?? []);
	}

	public newLabel(unreachable: boolean = false): string {
		return [
			unreachable ? 'unreachable' : 'block',
			this.#labelCounter++,
		].join('-');
	}

	/**
	 * Create a new IR temporary given a value; or a type, if uninitialized with a value.
	 * If a value is given, the type is read from that value.
	 * @return a new Temp with newly-generated id & name, the given value (or `undefined`), and the type
	 */
	public newTemp(value_or_type: OP.Value | TYPE.Type): Temp {
		const id:   bigint = this.#tempCounter--; // temp ids are negative so as not to conflict with actual variable ids
		const name: string = `$${ -id }`; // appears positive
		const temp: Temp   = {
			id,
			name,
			...(value_or_type instanceof OP.Value
				? {value: value_or_type, type: value_or_type.type}
				: {type: value_or_type}
			),
		};
		return temp;
	}

	public initiateBlock(label: string): void {
		if (this.currentBlock) {
			throw new Error('Cannot initiate a new block in a Builder with an active block. Try calling `Builder#terminateBlock` first.');
		}
		this.currentBlock = new CfgNode(label);
	}

	public terminateBlock(instr: OP.Terminator): void {
		if (!this.currentBlock) {
			throw new Error('Builder does not have an active block to terminate. Try calling `Builder#initiateBlock` first.');
		}
		this.currentBlock.terminate(instr);
		this.#blocks.set(this.currentBlock.label, this.currentBlock);
		delete this.currentBlock;
	}


	public pushInstruction(instr: OP.Instruction): void {
		if (!this.currentBlock) {
			throw new Error('Builder does not have an active block to push to. Try calling `Builder#initiateBlock` first.');
		}
		this.currentBlock.pushInstruction(instr);
	}

	@runOnceMethod
	public validate(): void {
		assert.ok(!this.currentBlock, 'Should not validate Builder with active block set. Try calling `Builder#terminateBlock` first.');
		return xjs.Map.forEachAggregated(this.#blocks, (block) => block.validate());
	}

	public codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		assert.ok(!this.currentBlock, 'Should not codegen Builder with active block set. Try calling `Builder#terminateBlock` first.');
		const relooper = new binaryen.Relooper(cg.mod);
		const blockrefs: ReadonlyMap<string, binaryen.RelooperBlockRef> = new Map([...this.#blocks.values()].map((block) => [block.label, block.codegen(cg, relooper)]));
		this.#blocks.forEach((block) => block.terminator!.codegen(cg, relooper, blockrefs));
		return relooper.renderAndDispose(blockrefs.get('block-0')!, cg.getAllLocals().length);
	}

	public print(): string {
		return [
			...this.#blocks.values(),
			...(this.currentBlock ? [this.currentBlock] : []),
		].map((block) => block.toString()).join('\n');
	}
}
