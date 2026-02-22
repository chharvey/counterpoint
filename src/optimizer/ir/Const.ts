import type {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import {Value} from './Value.ts';



export class Const extends Value {
	public constructor(private readonly value: VALUE.Primitive) {
		super();
	}

	public override get type(): TYPE.Type {
		return this.value.toType();
	}

	public override toString(): string {
		return `(CONST ${ this.value })`;
	}
}
