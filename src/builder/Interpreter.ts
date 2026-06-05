import type {VALUE} from '../typer/index.ts';
import type {SymbolSchemaVar} from '../validator/index.ts';
import type {Temp} from './Builder.ts';



export class Interpreter {
	readonly #symbolTable = new Map<SymbolSchemaVar | Temp, VALUE.Value>();


	public setLocalValue(local: SymbolSchemaVar | Temp, value: VALUE.Value): void {
		this.#symbolTable.set(local, value);
	}

	public getLocalValue(local: SymbolSchemaVar | Temp): VALUE.Value | undefined {
		return this.#symbolTable.get(local);
	}
}
