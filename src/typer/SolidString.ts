import * as xjs from 'extrajs';
import utf8 from 'utf8';
import type {CodeUnit} from './package.js';
import type {SolidObject} from './SolidObject.js';
import {Primitive} from './Primitive.js';



/**
 * A textual Solid Language Value.
 * @final
 */
export class SolidString extends Primitive {
	private readonly codeunits: readonly CodeUnit[];
	constructor (data: string | readonly CodeUnit[] = []) {
		super();
		this.codeunits = (typeof data === 'string')
			? [...utf8.encode(data)].map((ch) => ch.codePointAt(0)!)
			: data
	}

	override get isEmpty(): boolean {
		return this.codeunits.length === 0;
	}
	protected override get builtValue(): never {
		throw new Error('`SolidString#built_value` not yet supported.');
	}
	override toString(): string {
		return `'${ utf8.decode(String.fromCodePoint(...this.codeunits)) }'`;
	}
	protected override identical_helper(value: SolidObject): boolean {
		return value instanceof SolidString && xjs.Array.is(this.codeunits, value.codeunits);
	}

	override toSolidString(): SolidString {
		return this;
	}

	/**
	 * Concatenate this String with the argument.
	 * @param str the String to append to this String
	 * @returns   a new String whose code units are this string’s concatenated with the argument’s
	 */
	concatenate(str: SolidString): SolidString {
		return new SolidString([
			...this.codeunits,
			...str.codeunits,
		]);
	}
}
