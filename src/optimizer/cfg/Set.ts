import type {Variable} from './Variable.ts';
import {Instruction} from './Instruction.ts';



class IrSet extends Instruction {
	public static string(target: Variable, value: Instruction | string): string {
		return `(SET ${ target } ${ value })`;
	}

	public constructor(
		private readonly target: Variable,
		private readonly value:  Instruction,
	) {
		super();
	}

	public override toString(): string {
		return IrSet.string(this.target, this.value);
	}
}
export {IrSet as Set};
