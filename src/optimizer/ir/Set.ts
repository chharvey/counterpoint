import {SymbolSchemaVar} from '../../validator/index.ts';
import type {Local} from '../utils-public.ts';
import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';



/** Write a value to a variable/local. */
class IrSet extends Instruction {
	public constructor(
		private readonly target: SymbolSchemaVar | Local,
		private readonly value:  Value,
	) {
		super();
	}

	public override toString(): string {
		return `(SET ${ this.target instanceof SymbolSchemaVar ? this.target.source : this.target.name } ${ this.value })`;
	}
}
export {IrSet as Set};
