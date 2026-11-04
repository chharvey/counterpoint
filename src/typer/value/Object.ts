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
 * Represents a general instance of a Counterpoint Object.
 *
 * Note: Use this class for constructing user-defined objects,
 * i.e. not instances of List, Dict, etc.
 */
class ValueObject extends Value {
	public readonly id: bigint = 0n; // TODO: interpreter object ids

	// TODO: constructor

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
		return TYPE.OBJ;
	}
}
export type {ValueObject as Object};
