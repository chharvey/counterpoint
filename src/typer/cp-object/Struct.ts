import type {Object as CPObject} from './Object.js';
import {Record} from './Record.js';



export class Struct<T extends CPObject = CPObject> extends Record<T> {
	public override toString(): string {
		return `\\${ super.toString() }`;
	}

	protected override identical_helper(value: CPObject): boolean {
		return value instanceof Struct && this.equalSubsteps(value);
	}
}
