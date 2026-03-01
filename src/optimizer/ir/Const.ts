import * as assert from 'node:assert';
import {VALUE} from '../../typer/index.ts';
import {Type} from './Type.ts';
import {Value} from './Value.ts';



/** A constant primitive value. */
export class Const extends Value {
	public constructor(private readonly value: VALUE.Primitive) {
		super(( // copied from `AST.DeclarationVariable::writable_inferred_type` v0.5+ and modified slightly
			value instanceof VALUE.Null    ? Type.NULL :
			value instanceof VALUE.Boolean ? Type.BOOL :
			value instanceof VALUE.Symbol  ? Type.SYM :
			value instanceof VALUE.Integer ? Type.INT :
			// value instanceof VALUE.Natural ? Type.NAT :
			value instanceof VALUE.Float   ? Type.FLOAT :
			value instanceof VALUE.String  ? Type.STR :
			assert.fail(`Expected ${ value } to be a primitive value.`)
		));
	}

	public override toString(): string {
		return `(${ this.type }.CONST ${ this.value })`;
	}

	public override asTac(): Const {
		return this;
	}
}
