import {equal_nullish_values} from '../../lib/index.ts';
import {TYPE} from '../index.ts';
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
	private readonly fields = new Dict<Value>();


	public constructor(
		private readonly id:      bigint,
		private readonly class_?: ValueClass,
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
			equal_nullish_values(this.class_, obj.class_, (a, b) => a.identical(b)) &&
			this.fields.equal(obj.fields)
		);
	}

	public override toType(): TYPE.Type {
		return this.class_?.instanceType ?? TYPE.CLASS;
	}
}
export {ValueObject as Object};
