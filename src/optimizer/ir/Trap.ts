import {Value} from './Value.ts';



export class Trap extends Value {
	public override toString(): string {
		return '(TRAP)';
	}
}
