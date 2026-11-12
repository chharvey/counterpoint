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
import type {Exception} from './Exception.ts';



/**
 * A `Result` repesents a success or failure.
 * Known subclasses:
 * - Fail
 * - Ok
 */
export abstract class Result extends Value {
}



export class Fail extends Result {
	public constructor(
		private readonly successType: TYPE.Type,
		public  readonly reason:      Exception,
	) {
		super();
	}


	public override toString(): string {
		return `<Fail instance ${(0x00).toString(16)}>`; // TODO: interpreter object ids
	}

	@strictEqual
	@identical
	@memoizeBinOp(true, true)
	@instanceOf(() => Fail)
	public override equal(value: Value): boolean {
		return this.reason.equal((value as Fail).reason);
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.Fail with the given success type argument and whose failure type argument is the type of this Fail’s reason.
	 */
	public override toType(): TYPE.Result {
		return new TYPE.Fail(this.successType, this.reason.toType());
	}
}



export class Ok<T extends Value = Value> extends Result {
	public constructor(
		public  readonly value:       T,
		private readonly failureType: TYPE.Type = TYPE.EXCP,
	) {
		super();
	}


	public override toString(): string {
		return `<Ok instance ${(0x00).toString(16)}>`; // TODO: interpreter object ids
	}

	@strictEqual
	@identical
	@memoizeBinOp(true, true)
	@instanceOf(() => Ok)
	public override equal(value: Value): boolean {
		return this.value.equal((value as Ok).value);
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.Fail with the given success type argument and whose failure type argument is the type of this Fail’s reason.
	 */
	public override toType(): TYPE.Result {
		return new TYPE.Ok(this.value.toType(), this.failureType);
	}
}
