import {SymbolSchemaVar} from '../../validator/index.ts';
import type {Local} from '../utils-public.ts';
import {Instruction} from './Instruction.ts';



/** Declare a variable/local without initializing it. */
export class Decl extends Instruction {
	public constructor(private readonly target: SymbolSchemaVar | Local) {
		super();
	}

	public override toString(): string {
		return `(DECL ${ this.target instanceof SymbolSchemaVar ? this.target.source : this.target.name })`;
	}
}
