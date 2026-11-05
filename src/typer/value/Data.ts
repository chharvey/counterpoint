import type {TYPE} from '../index.ts';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import {Value} from './Value.ts';
import {Dict} from './Dict.ts';



/**
 * Represents a general instance of a Counterpoint “data class”
 * (which are pass-by-value and have no identity).
 */
export class Data extends Value {
	// TODO: `constructor` field

	public readonly fields = new Dict<Value>();


	public constructor(private readonly type: TYPE.Type) {
		super();
	}


	public override toString(): string {
		return `<instance ${this.fields}>`;
	}

	@strictEqual
	@memoizeBinOp(true, true)
	@instanceOf(() => Data)
	public override identical(value: Value): boolean {
		const data = value as Data;
		// TODO: check constructors by identity
		// TODO: check for shallow-identity of field dicts
		return !!data;
	}

	public override toType(): TYPE.Type {
		return this.type;
	}
}
