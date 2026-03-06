import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {SymbolSchemaVar} from '../../validator/index.ts';
import type {Local} from '../utils-private.ts';
import {Value} from './Value.ts';



/** Read the value of a variable/local. */
export class Get extends Value {
	public constructor(private readonly target: SymbolSchemaVar | Local) {
		super(target instanceof SymbolSchemaVar ? target.irType : target.type);
	}

	public override toString(): string {
		return `(GET ${ this.target instanceof SymbolSchemaVar ? this.target.source : this.target.name })`;
	}

	@memoizeMethod
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		return cg.localGet(this.target.id);
	}

	public override asTac(): Get {
		return this;
	}
}
