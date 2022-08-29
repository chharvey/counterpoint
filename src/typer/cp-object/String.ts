import * as xjs from 'extrajs';
import utf8 from 'utf8';
import type {CodeUnit} from './package.js';
import type {Object} from './Object.js';
import {Primitive} from './Primitive.js';



/**
 * A textual value represented as utf-8 data.
 * @final
 */
class CPString extends Primitive {
	private readonly codeunits: readonly CodeUnit[];
	constructor(data: string | readonly CodeUnit[] = []) {
		super();
		this.codeunits = (typeof data === 'string')
			? [...utf8.encode(data)].map((ch) => ch.codePointAt(0)!)
			: data;
	}

	override get isEmpty(): boolean {
		return this.codeunits.length === 0;
	}

	override toString(): string {
		return `'${ utf8.decode(String.fromCodePoint(...this.codeunits)) }'`;
	}

	protected override identical_helper(value: Object): boolean {
		return value instanceof CPString && xjs.Array.is(this.codeunits, value.codeunits);
	}

	override toCPString(): CPString {
		return this;
	}

	/**
	 * Concatenate this String with the argument.
	 * @param str the String to append to this String
	 * @returns   a new String whose code units are this string’s concatenated with the argument’s
	 */
	concatenate(str: CPString): CPString {
		return new CPString([
			...this.codeunits,
			...str.codeunits,
		]);
	}
}
export {CPString as String};
