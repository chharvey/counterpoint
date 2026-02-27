import * as assert from 'node:assert';
import {VALUE} from '../../typer/index.ts';
import {TypeName} from './TypeName.ts';
import {Value} from './Value.ts';



/** A constant primitive value. */
export class Const extends Value {
	public constructor(private readonly value: VALUE.Primitive) {
		super(value.toType());
	}

	public override toString(): string {
		const type_name: TypeName = ( // copied from `AST.DeclarationVariable::writable_inferred_type` v0.5+ and modified slightly
			this.value instanceof VALUE.Null    ? TypeName.NULL :
			this.value instanceof VALUE.Boolean ? TypeName.BOOL :
			this.value instanceof VALUE.Symbol  ? TypeName.SYM :
			this.value instanceof VALUE.Integer ? TypeName.INT :
			// this.value instanceof VALUE.Natural ? TypeName.NAT :
			this.value instanceof VALUE.Float   ? TypeName.FLOAT :
			this.value instanceof VALUE.String  ? TypeName.STR :
			assert.fail(`Expected ${ this.value } to be a primitive value.`)
		);
		return `(${ TypeName[type_name] }.CONST ${ this.value })`;
	}

	public override asTac(): Const {
		return this;
	}
}
