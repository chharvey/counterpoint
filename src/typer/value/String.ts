import * as util from 'node:util';
import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
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
	/**
	 * Internal implementation of this ValueString.
	 * A sequence of bytes stored in a Uint8Array.
	 */
	private readonly data: Readonly<Uint8Array>;

	public constructor(data: string | Uint8Array = new Uint8Array()) {
		super();
		this.data = typeof data === 'string'
			? new TextEncoder().encode(data)
			: data;
	}

	/**
	 * @implements Value
	 */
	public override get isEmpty(): boolean {
		return this.data.length === 0;
	}

	public override toString(): string {
		return `${ DELIM_STRING }${ new TextDecoder().decode(this.data) }${ DELIM_STRING }`;
	}

	@strictEqual
	@memoizeBinOp(true, true)
	@instanceOf(() => ValueString)
	public override identical(value: Value): boolean {
		return util.isDeepStrictEqual(this.data, (value as ValueString).data);
	}

	public override toCplString(): ValueString {
		return this;
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.vm.Value.newComposite(cg.codegenString([...this.data].map((c) => cg.mod.wasm.i32.const(c))));
	}

	/**
	 * Concatenate this String with the argument.
	 * @param str the String to append to this String
	 * @returns   a new String whose code units are this string’s concatenated with the argument’s
	 */
	public concatenate(str: ValueString): ValueString {
		return new ValueString(new Uint8Array([
			...this.data,
			...str.data,
		]));
	}
}
export {ValueString as String};
