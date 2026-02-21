import {Instruction} from './Instruction.ts';



export class Trap extends Instruction {
	public override toString(): string {
		return '(TRAP)';
	}
}
