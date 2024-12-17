import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import utf8 from 'utf8';
import {
	type CodeUnit,
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../../lib/index.js';
import type {Object as CPObject} from './Object.js';
import {Primitive} from './Primitive.js';



const DELIM_STRING = '"';



/**
 * A textual value represented as utf-8 data.
 * @final
 */
class CPString extends Primitive {
	private readonly codeunits: readonly CodeUnit[];
	public constructor(data: string | readonly CodeUnit[] = []) {
		super();
		this.codeunits = (typeof data === 'string')
			? [...utf8.encode(data)].map((ch) => ch.codePointAt(0)!)
			: data;
	}

	public override get isEmpty(): boolean {
		return this.codeunits.length === 0;
	}

	public override toString(): string {
		return `${ DELIM_STRING }${ utf8.decode(String.fromCodePoint(...this.codeunits)) }${ DELIM_STRING }`;
	}

	@strictEqual
	@instanceOf(() => CPString)
	@memoizeBinOp(true, true)
	public override identical(value: CPObject): boolean {
		return xjs.Array.is<CodeUnit>(this.codeunits, (value as CPString).codeunits);
	}

	public override toCPString(): CPString {
		return this;
	}

	public override build(mod: binaryen.Module): binaryen.ExpressionRef {
		mod;
		throw '`CPString#build` not yet supported.';
	}

	/**
	 * Concatenate this String with the argument.
	 * @param str the String to append to this String
	 * @returns   a new String whose code units are this string’s concatenated with the argument’s
	 */
	public concatenate(str: CPString): CPString {
		return new CPString([
			...this.codeunits,
			...str.codeunits,
		]);
	}
}
export {CPString as String};
