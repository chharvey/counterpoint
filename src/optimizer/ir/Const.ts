import * as assert from 'node:assert';
import {VALUE} from '../../typer/index.ts';
import {TypeName} from './Type.ts';
import {Value} from './Value.ts';



/** A constant primitive value. */
export class Const extends Value {
	public constructor(private readonly value: VALUE.Primitive) {
		super(( // copied from `AST.DeclarationVariable::writable_inferred_type` v0.5+ and modified slightly
			value instanceof VALUE.Null    ? TypeName.NULL :
			value instanceof VALUE.Boolean ? TypeName.BOOL :
			value instanceof VALUE.Symbol  ? TypeName.SYM :
			value instanceof VALUE.Integer ? TypeName.INT :
			// value instanceof VALUE.Natural ? TypeName.NAT :
			value instanceof VALUE.Float   ? TypeName.FLOAT :
			value instanceof VALUE.String  ? TypeName.STR :
			assert.fail(`Expected ${ value } to be a primitive value.`)
		));
	}

	public override toString(): string {
		return `(${ TypeName[this.type] }.CONST ${ this.value })`;
	}

	public override asTac(): Const {
		return this;
	}
}
