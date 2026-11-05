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



/**
 * Represents a general instance of the Counterpoint `Object` class (or any subclass).
 *
 * Note: Use this class for constructing user-defined objects,
 * i.e. not instances of the built-in `List`, `Dict`, etc.
 */
class ValueObject extends Value {
	public readonly id: bigint = 0n; // TODO: interpreter object ids

	// TODO: `constructor` field

	public readonly fields = new Dict<Value>();


	public override toString(): string {
		return `<Object instance ${this.id.toString(16)}>`;
	}

	@strictEqual
	@identical
	@memoizeBinOp(true, true)
	@instanceOf(() => ValueObject)
	public override equal(value: Value): boolean {
		const obj = value as ValueObject;
		// TODO: check constructors by identity
		return this.fields.equal(obj.fields);
	}

	public override toType(): TYPE.Type {
		return TYPE.OBJ; // TODO: return an interface type, given by this object’s `constructor`
	}
}
export {ValueObject as Object};
