import type {Get} from './Get.ts';
import {Instruction} from './Instruction.ts';



class IrSet extends Instruction {
	public constructor(
		private readonly target: Get,
		private readonly value:  Instruction,
	) {
		super();
	}

	public override toString(): string {
		return `(SET ${ this.target } ${ this.value })`;
	}
}
export {IrSet as Set};
