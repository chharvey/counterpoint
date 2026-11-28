import * as assert from 'node:assert';
import type {VALUE} from '../typer/index.ts';
import {SymbolSchema} from '../validator/index.ts';
import type {BuilderSymbol} from './Builder.ts';
import type {CfgNode} from './CfgNode.ts';



export class Interpreter {
	/**
	 * A map of local variable/temp values.
	 * If the variable is declared but uninitialized/deleted, its value is an empty `Maybe` object (a `None`).
	 */
	readonly #symbolTable = new Map<BuilderSymbol, VALUE.Value>();

	readonly #blocks = new Map<string, CfgNode>();

	readonly #drops: VALUE.Value[] = [];


	/** Outputs of `OP.Drop` instructions. */
	public get drops(): VALUE.Value[] {
		return [...this.#drops];
	}


	public setSymbolValue(schema: BuilderSymbol, value: VALUE.Value): void {
		this.#symbolTable.set(schema, value);
	}

	public getSymbolValue(schema: BuilderSymbol): VALUE.Value | undefined {
		return this.#symbolTable.get(schema);
	}

	public getSymbolValueOrThrow(schema: BuilderSymbol): VALUE.Value {
		return this.getSymbolValue(schema) ?? assert.fail(new ReferenceError(`Expected symbol \`${schema instanceof SymbolSchema ? schema.source : schema.name}\` to be registered in interpreter.`));
	}

	public registerBlock(block: CfgNode): void {
		this.#blocks.set(block.label, block);
	}

	public interpretNextBlock(label: string): void {
		if (!this.#blocks.has(label)) {
			throw new Error(`CfgNode with label \`${label}\` not found in Interpreter.`);
		}
		return this.#blocks.get(label)!.interpret(this);
	}

	public pushDrop(value: VALUE.Value): void {
		this.#drops.push(value);
	}
}
