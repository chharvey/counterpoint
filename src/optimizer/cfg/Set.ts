import type {Variable} from './Value.ts';
import {Instruction} from './Instruction.ts';



class CfgSet extends Instruction {
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
		return CfgSet.string(this.target, this.value);
	}
}
export {CfgSet as Set};
