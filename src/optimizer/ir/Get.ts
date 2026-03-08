import {SymbolSchemaVar} from '../../validator/index.ts';
import type {Local} from '../utils-private.ts';
import {OpCode} from './utils-public.ts';
import {Value} from './Value.ts';



/** Read the value of a variable/local. */
export class Get extends Value {
	public constructor(private readonly target: SymbolSchemaVar | Local) {
		super(OpCode.GET, target instanceof SymbolSchemaVar ? target.irType : target.type);
	}

	public override toString(): string {
		return super.toString(this.target instanceof SymbolSchemaVar ? this.target.source : this.target.name);
	}

	public override asTac(): Get {
		return this;
	}
}
