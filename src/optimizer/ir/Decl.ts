import {SymbolSchemaVar} from '../../validator/index.ts';
import type {TYPE} from '../../typer/index.ts';
import type {Local} from '../utils-private.ts';
import {Type} from './Type.ts';
import {Instruction} from './Instruction.ts';



/** Declare a variable/local without initializing it. */
export class Decl extends Instruction {
	public constructor(
		private readonly target: SymbolSchemaVar | Local,
		private readonly type:   TYPE.Type,
	) {
		super();
	}

	public override toString(): string {
		return `(DECL ${ Type.fromAstType(this.type) } ${ this.target instanceof SymbolSchemaVar ? this.target.source : this.target.name })`;
	}
}
