import type {Object as CPObject} from './Object.js';
import {Tuple} from './Tuple.js';



export class Vect<T extends CPObject = CPObject> extends Tuple<T> {
	protected override identical_helper(value: CPObject): boolean {
		return value instanceof Vect && this.equalSubsteps(value);
	}
}
