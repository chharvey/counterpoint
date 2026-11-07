import {
	VALUE,
	CLASS_CLASS,
} from '../typer/index.ts';
import {
	CoreLibName,
	CORE_LIB_NAMES,
} from '../parser/index.ts';
import {SymbolSchemaClass} from '../validator/index.ts';
import type {BuilderLocalSymbol} from './Builder.ts';
import type {CfgNode} from './CfgNode.ts';



export class Interpreter {
	/**
	 * A map of local variable/temp values.
	 * If the variable is declared but uninitialized/deleted, its value is an empty `Maybe` object (a `None`).
	 */
	readonly #symbolTable = new Map<BuilderLocalSymbol, VALUE.Value>();

	readonly #blocks = new Map<string, CfgNode>();

	readonly #drops: VALUE.Value[] = [];


	/** Outputs of `OP.Drop` instructions. */
	public get drops(): VALUE.Value[] {
		return [...this.#drops];
	}


	public setLocalValue(local: BuilderLocalSymbol, value: VALUE.Value): void {
		this.#symbolTable.set(local, value);
	}

	public getLocalValue(local: BuilderLocalSymbol): VALUE.Value | undefined {
		if (
			local instanceof SymbolSchemaClass &&
			CORE_LIB_NAMES.includes(local.source as CoreLibName)
		) {
			// TODO: Map#getOrInsertComputed
			this.#symbolTable.has(local) || this.#symbolTable.set(local, local.source === CoreLibName.CLASS
				? CLASS_CLASS
				: new VALUE.Class(local.classSignature.supertype, CLASS_CLASS));
		}
		return this.#symbolTable.get(local);
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
