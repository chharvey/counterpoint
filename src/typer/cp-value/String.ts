import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import utf8 from 'utf8';
import type {
	Builder,
	BinVect,
} from '../../index.ts';
import type {CodeUnit} from '../../lib/index.ts';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import type {Value} from './Value.ts';
import {Primitive} from './Primitive.ts';



const DELIM_STRING = '"';



/**
 * A textual value represented as utf-8 data.
 * @final
 */
class ValueString extends Primitive {
	private readonly codeunits: readonly CodeUnit[];
	public constructor(data: string | readonly CodeUnit[] = []) {
		super();
		this.codeunits = (typeof data === 'string')
			? [...utf8.encode(data)].map((ch) => ch.codePointAt(0)!)
			: data;
	}

	/**
	 * @implements Value
	 */
	public override get isEmpty(): boolean {
		return this.codeunits.length === 0;
	}

	public override toString(): string {
		return `${ DELIM_STRING }${ utf8.decode(String.fromCodePoint(...this.codeunits)) }${ DELIM_STRING }`;
	}

	@strictEqual
	@memoizeBinOp(true, true)
	@instanceOf(() => ValueString)
	public override identical(value: Value): boolean {
		return xjs.Array.is<CodeUnit>(this.codeunits, (value as ValueString).codeunits);
	}

	public override toCPString(): ValueString {
		return this;
	}

	public override codegen(_: binaryen.Module): BinVect {
		throw new Error('`ValueString#codegen` not yet supported.');
	}

	public override build(builder: Builder): binaryen.ExpressionRef {
		return this.codegen(builder.module).vect;
	}

	/**
	 * Concatenate this String with the argument.
	 * @param str the String to append to this String
	 * @returns   a new String whose code units are this string’s concatenated with the argument’s
	 */
	public concatenate(str: ValueString): ValueString {
		return new ValueString([
			...this.codeunits,
			...str.codeunits,
		]);
	}
}
export {ValueString as String};
