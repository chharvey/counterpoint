import * as assert from 'node:assert';
import * as binaryen from 'binaryen.ts';
import * as xjs from 'extrajs';
import type {CodeGenerator} from '../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../lib/index.ts';
import type {TYPE} from '../typer/index.ts';
import type {
	SymbolSchemaVar,
	SymbolSchemaClass,
} from '../validator/index.ts';
import {
	OP,
	type Interpreter,
} from './index.ts';
import {CfgNode} from './CfgNode.ts';



/** A variable internal to the Builder (not present in the AST). */
export type Temp = {
	readonly id:     bigint,
	readonly name:   string,
	readonly type:   TYPE.Type,
	readonly value?: OP.Value,
};



export type BuilderSymbol = SymbolSchemaVar | SymbolSchemaClass | Temp;
export enum BuilderSymbolStatus {
	DECLARED,
	SET,
}



/**
 * The Builder is responsible for converting an abstract syntax tree (AST) into a high-level internal representation (IR),
 * taking the form of a control flow graph (CFG). Unlike the AST, which represents syntax structure,
 * the CFG represents execution order. The CFG assumes the AST is already validated.
 */
export class Builder {
	#tempCounter:  bigint = 0n;
	#labelCounter: bigint = 0n;

	/** A map containing local variable/temp statuses. */
	readonly #symbols = new Map<BuilderSymbol, BuilderSymbolStatus>();

	/**
	 * Declared function overloads, stored in Temps.
	 * Function overload declarations all share the same id, so SymbolSchemaFunc cannot be used.
	 * Every function declaration visited has its own Temp.
	 */
	readonly #funcs = new Map<bigint, WeakMap<TYPE.Function, Temp>>();

	private currentBlock?: CfgNode = new CfgNode(this.newLabel());

	readonly #blocks: CfgNode[] = [];


	/**
	 * Construct a new Builder object.
	 * @param parent - an enlosing Builder
	 */
	public constructor(private readonly parent?: Builder) {
	}


	public get instructions(): OP.Instruction[] {
		return this.#blocks.flatMap((block) => block.instructions).concat(this.currentBlock?.instructions ?? []);
	}

	public newLabel(unreachable: boolean = false): string {
		return `${unreachable ? 'unreachable' : 'block'}-${this.#labelCounter++}`;
	}

	/**
	 * Create a new IR temporary given a value; or a type, if uninitialized with a value.
	 * If a value is given, the type is read from that value.
	 * @return a new Temp with newly-generated id & name, the given value (or `undefined`), and the type
	 */
	public newTemp(value_or_type: OP.Value | TYPE.Type): Temp {
		const id:   bigint = this.#tempCounter--; // temp ids are negative so as not to conflict with actual variable ids
		const name: string = `$${-id}`; // appears positive
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

	public getSymbolStatus(schema: BuilderSymbol): BuilderSymbolStatus | undefined {
		return this.#symbols.get(schema);
	}

	public setSymbolStatus(schema: BuilderSymbol, status: BuilderSymbolStatus): void {
		this.#symbols.set(schema, status);
	}

	private hasFunc(id: bigint): boolean {
		return this.#funcs.has(id) || (this.parent?.hasFunc(id) ?? false);
	}

	private getFunc(id: bigint, ovl_type: TYPE.Function): Temp | undefined {
		return this.#funcs.get(id)?.get(ovl_type) ?? this.parent?.getFunc(id, ovl_type);
	}

	public setFunc(id: bigint, ovl_type: TYPE.Function, temp: Temp): void {
		if (!this.hasFunc(id)) {
			this.#funcs.set(id, new WeakMap());
		}
		this.#funcs.get(id)!.set(ovl_type, temp);
	}

	private removeFunc(id: bigint, ovl_type?: TYPE.Function): void {
		if (this.hasFunc(id) && ovl_type) {
			this.#funcs.get(id)!.delete(ovl_type);
		}
		this.#funcs.delete(id);
	}

	private getAllFuncs(): Map<bigint, WeakMap<TYPE.Function, Temp>> {
		return new Map([...(this.parent ? this.parent.#funcs : []), ...this.#funcs]);
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
		assert.ok(!this.#blocks.includes(this.currentBlock));
		this.currentBlock.terminate(instr);
		this.#blocks.push(this.currentBlock);
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
		return xjs.Array.forEachAggregated(this.#blocks, (block) => block.validate(this));
	}

	public interpret(interp: Interpreter): void {
		assert.ok(!this.currentBlock, 'Should not interpret Builder with active block set. Try calling `Builder#terminateBlock` first.');
		this.#blocks.forEach((block) => interp.registerBlock(block));
		return this.#blocks[0]?.interpret(interp);
	}

	@memoizeMethod
	public codegen(cg: CodeGenerator): binaryen.ExpressionRef /* void */ {
		assert.ok(!this.currentBlock, 'Should not codegen Builder with active block set. Try calling `Builder#terminateBlock` first.');
		const relooper     = new binaryen.Relooper(cg.mod);
		const term_visitor = new OP.TermVisitorCodegen(cg, relooper);
		this.#blocks.forEach((block) => cg.registerBlockRef(block.label, block.codegen(cg, relooper))); // code-gen & register all blocks before code-genning terminators
		this.#blocks.forEach((block) => term_visitor.visit(block.terminator!));
		return relooper.renderAndDispose(cg.getBlockRef('block-0'), cg.getAllLocals().length);
	}

	public print(): string {
		return [
			...this.#blocks,
			...(this.currentBlock ? [this.currentBlock] : []),
		].map((block) => block.toString()).join('\n');
	}
}
