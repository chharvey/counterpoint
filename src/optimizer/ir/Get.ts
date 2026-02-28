import {SymbolSchemaVar} from '../../validator/index.ts';
import type {Local} from '../utils-public.ts';
import {Value} from './Value.ts';



/** Read the value of a variable/local. */
export class Get extends Value {
	public constructor(private readonly target: SymbolSchemaVar | Local) {
		super(target instanceof SymbolSchemaVar ? target.type : target.type);
	}

	public override toString(): string {
		return `(GET ${ this.target instanceof SymbolSchemaVar ? this.target.source : this.target.name })`;
	}

	public override asTac(): Get {
		return this;
	}
}
