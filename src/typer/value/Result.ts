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
 * @final
 */
export class Result<T extends Value = Value> extends Value {
	private readonly successType: TYPE.Type = TYPE.ANYTHING;
	private readonly failureType: TYPE.Type = TYPE.EXCP;


	public constructor(
		private readonly isOk:     boolean,
		private readonly argument: T | Exception,
	) {
		super();
		if (isOk) {
			this.successType = argument.toType();
		} else {
			this.failureType = argument.toType();
		}
	}

	public get isFail(): boolean {
		return !this.isOk;
	}


	public override toString(): string {
		return `<Result instance ${(0x00).toString(16)}>`; // TODO: interpreter object ids
	}

	@strictEqual
	@identical
	@memoizeBinOp(true, true)
	@instanceOf(() => Result)
	public override equal(value: Value): boolean {
		const result = value as Result;
		return this.isOk === result.isOk && this.argument.equal(result.argument);
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.Result whose type argument is the type of this Maybe’s value (defaulting to `anything`).
	 */
	public override toType(): TYPE.Result {
		return new TYPE.Result(this.successType, this.failureType);
	}
}
