import type {VALUE} from '../../typer/index.ts';
import {
	TypeName,
	ast_type_name,
} from './TypeName.ts';
import {Value} from './Value.ts';



/** A constant primitive value. */
export class Const extends Value {
	public constructor(private readonly value: VALUE.Primitive) {
		super(value.toType());
	}

	public override toString(): string {
		return `(${ TypeName[ast_type_name(this.type)] }.CONST ${ this.value })`;
	}

	public override asTac(): Const {
		return this;
	}
}
