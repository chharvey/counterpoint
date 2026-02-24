import type {VALUE} from '../../typer/index.ts';
import {Value} from './Value.ts';



/** A constant primitive value. */
export class Const extends Value {
	public constructor(private readonly value: VALUE.Primitive) {
		super(value.toType());
	}

	public override toString(): string {
		return `(CONST ${ this.value })`;
	}
}
