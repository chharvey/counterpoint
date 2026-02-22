import type {VALUE} from '../../typer/index.ts';
import {Value} from './Value.ts';



export class Const extends Value {
	public constructor(private readonly value: VALUE.Primitive) {
		super();
	}

	public override toString(): string {
		return `(CONST ${ this.value })`;
	}
}
