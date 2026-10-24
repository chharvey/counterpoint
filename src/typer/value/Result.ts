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

	private readonly successValue?:  T;
	private readonly failureReason?: Exception;


	public constructor(is_ok: true,    value: T);
	public constructor(is_ok: false,   reason: Exception);
	public constructor(is_ok: boolean, value_or_reason: T | Exception) {
		super();
		if (is_ok) {
			[this.successType, this.successValue] = [value_or_reason.toType(), value_or_reason as T];
		} else {
			[this.failureType, this.failureReason] = [value_or_reason.toType(), value_or_reason as Exception];
		}
	}

	public get isFail(): boolean {
		return !this.successValue;
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
		return (
			!!this.successValue  && !!result.successValue  && this.successValue  .equal(result.successValue) ||
			!!this.failureReason && !!result.failureReason && this.failureReason .equal(result.failureReason)
		);
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.Result whose type argument is the type of this Maybe’s value (defaulting to `anything`).
	 */
	public override toType(): TYPE.Result {
		return new TYPE.Result(this.successType, this.failureType);
	}
}
