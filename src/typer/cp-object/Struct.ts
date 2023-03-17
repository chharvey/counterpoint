import {strictEqual} from '../../lib/index.js';
import type {Object as CPObject} from './Object.js';
import {Record} from './Record.js';



export class Struct<T extends CPObject = CPObject> extends Record<T> {
	public override toString(): string {
		return `\\${ super.toString() }`;
	}

	@strictEqual
	public override identical(value: CPObject): boolean {
		return value instanceof Struct && this.equalSubsteps(value);
	}
}
