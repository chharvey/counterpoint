import type {VALUE} from '../../typer/index.ts';
import {Type} from './Type.ts';
import {Value} from './Value.ts';



/** A constant primitive value. */
export class Const extends Value {
	public constructor(private readonly value: VALUE.Primitive) {
		super(value.toType());
	}

	public override toString(): string {
		return `(${ Type.fromAstType(this.type) }.CONST ${ this.value })`;
	}

	public override asTac(): Const {
		return this;
	}
}
