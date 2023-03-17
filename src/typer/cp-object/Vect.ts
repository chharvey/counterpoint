import {strictEqual} from '../../lib/index.js';
import type {Object as CPObject} from './Object.js';
import {Tuple} from './Tuple.js';



export class Vect<T extends CPObject = CPObject> extends Tuple<T> {
	public override toString(): string {
		return `\\${ super.toString() }`;
	}

	@strictEqual
	public override identical(value: CPObject): boolean {
		return value instanceof Vect && this.equalSubsteps(value);
	}
}
