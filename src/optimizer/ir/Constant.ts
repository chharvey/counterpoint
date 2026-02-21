import type {VALUE} from '../../typer/index.ts';
import {Instruction} from './Instruction.ts';



export class Constant extends Instruction {
	public constructor(private readonly value: VALUE.Primitive) {
		super();
	}

	public override toString(): string {
		return `(CONST ${ this.value })`;
	}
}
