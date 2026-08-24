import type {VALUE} from '../typer/index.ts';
import type {SymbolSchemaVar} from '../validator/index.ts';
import type {Temp} from './Builder.ts';
import type {CfgNode} from './CfgNode.ts';



export class Interpreter {
	/**
	 * A map of local variable/temp values.
	 * If the variable is declared but uninitialized/deleted, its value is an empty `Maybe` object (a `None`).
	 */
	readonly #symbolTable = new Map<SymbolSchemaVar | Temp, VALUE.Value>();

	readonly #blocks = new Map<string, CfgNode>();

	readonly #drops: VALUE.Value[] = [];


	/** Outputs of `OP.Drop` instructions. */
	public get drops(): VALUE.Value[] {
		return [...this.#drops];
	}


	public setLocalValue(local: SymbolSchemaVar | Temp, value: VALUE.Value): void {
		this.#symbolTable.set(local, value);
	}

	public getLocalValue(local: SymbolSchemaVar | Temp): VALUE.Value | undefined {
		return this.#symbolTable.get(local);
	}

	public registerBlock(block: CfgNode): void {
		this.#blocks.set(block.label, block);
	}

	public interpretNextBlock(label: string): void {
		if (!this.#blocks.has(label)) {
			throw new Error(`CfgNode with label \`${ label }\` not found in Interpreter.`);
		}
		return this.#blocks.get(label)!.interpret(this);
	}

	public pushDrop(value: VALUE.Value): void {
		this.#drops.push(value);
	}
}
