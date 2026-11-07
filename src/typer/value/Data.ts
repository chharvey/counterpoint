import type {TYPE} from '../index.ts';
import {
	language_values_identical,
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import {Value} from './Value.ts';
import {CollectionKeyed} from './CollectionKeyed.ts';
import {Dict} from './Dict.ts';
import type {Class as ValueClass} from './Class.ts';



/**
 * Represents a general instance of a Counterpoint “data class”
 * (which are pass-by-value and have no identity).
 */
export class Data extends Value {
	private readonly fields = new Dict<Value>();


	public constructor(private readonly class_: ValueClass) {
		super();
	}


	public override toString(): string {
		return `<${this.class_} instance ${this.fields}>`;
	}

	@strictEqual
	@memoizeBinOp(true, true)
	@instanceOf(() => Data)
	public override identical(value: Value): boolean {
		const data = value as Data;
		return (
			this.class_.identical(data.class_) &&
			CollectionKeyed.samenessDfn(this.fields, data.fields, language_values_identical)
		);
	}

	public override toType(): TYPE.Type {
		return this.class_.instanceType;
	}
}
