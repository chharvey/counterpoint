import {SymbolSchemaVar} from '../../validator/index.ts';
import type {TYPE} from '../../typer/index.ts';
import type {Local} from '../utils-private.ts';
import {
	TypeName,
	ast_type_name,
} from './TypeName.ts';
import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';



/** Declare a variable/local without initializing it. */
export class Decl extends Instruction {
	public constructor(
		private readonly target: SymbolSchemaVar | Local,
		private readonly type:   TYPE.Type,
		private readonly value:  Value,
	) {
		super();
	}

	public override toString(): string {
		return `(DECL ${ TypeName[ast_type_name(this.type)] } ${ this.target instanceof SymbolSchemaVar ? this.target.source : this.target.name } ${ this.value })`;
	}
}
