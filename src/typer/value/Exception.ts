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



/**
 * An `Exception` is used for runtime error reporting.
 * @final
 */
export class Exception extends Value {
	public override readonly isTruthy: boolean = false;


	public constructor(
		private readonly message: string,
		private readonly cause?:  Exception,
	) {
		super();
	}


	public override toString(): string {
		return `<Exception instance ${(0x00).toString(16)}>`; // TODO: interpreter object ids
	}

	@strictEqual
	@identical
	@memoizeBinOp(true, true)
	@instanceOf(() => Exception)
	public override equal(value: Value): boolean {
		const exception = value as Exception;
		return this.message === exception.message && (
			this.cause && exception.cause ? this.cause.equal(exception.cause) : !this.cause && !exception.cause
		);
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.Maybe whose type argument is the type of this Maybe’s value (defaulting to `anything`).
	 */
	public override toType(): TYPE.Exception {
		return TYPE.EXCP;
	}
}
