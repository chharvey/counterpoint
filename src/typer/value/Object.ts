import type {TYPE} from '../index.ts';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import {
	identical,
	Value,
} from './Value.ts';
import {Dict} from './Dict.ts';
import type {Class as ValueClass} from './Class.ts';



/**
 * Represents a general instance of the Counterpoint `Object` class (or any subclass).
 *
 * Note: Use this class for constructing user-defined objects,
 * i.e. not instances of the built-in `List`, `Dict`, etc.
 */
class ValueObject extends Value {
	public constructor(
		private readonly id:     bigint,
		private readonly class_: ValueClass,
		private readonly fields = new Dict<Value>(),
	) {
		super();
	}


	public override toString(): string {
		return `<${this.class_} instance ${this.id.toString(16)}>`;
	}

	@strictEqual
	@identical
	@memoizeBinOp(true, true)
	@instanceOf(() => ValueObject)
	public override equal(value: Value): boolean {
		const obj = value as ValueObject;
		return (
			this.class_.identical(obj.class_) &&
			this.fields.equal(obj.fields)
		);
	}

	public override toType(): TYPE.Type {
		return this.class_.instanceType;
	}
}
export {ValueObject as Object};
