import * as assert from 'node:assert';
import {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import {Value} from './Value.ts';



/** A constant primitive value. */
export class Const extends Value {
	public constructor(private readonly value: VALUE.Primitive) {
		super(value.toType());
	}

	public override toString(): string {
		const wide_type = ( // copied from `AST.DeclarationVariable::writable_inferred_type`, v0.5+
			this.value instanceof VALUE.Null    ? TYPE.NULL :
			this.value instanceof VALUE.Boolean ? TYPE.BOOL :
			this.value instanceof VALUE.Symbol  ? TYPE.SYM :
			this.value instanceof VALUE.Integer ? TYPE.INT :
			// this.value instanceof VALUE.Natural ? TYPE.NAT :
			this.value instanceof VALUE.Float   ? TYPE.FLOAT :
			this.value instanceof VALUE.String  ? TYPE.STR :
			assert.fail(`Expected ${ this.value } to be a primitive value.`)
		);
		return `(${ wide_type.toString().toUpperCase() }.CONST ${ this.value })`;
	}
}
