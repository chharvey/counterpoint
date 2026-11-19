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
import type {String as ValueString} from './String.ts';



/**
 * An `Exception` is used for runtime error reporting.
 * @final
 */
export class Exception extends Value {
	public constructor(
		private readonly message: ValueString,
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
		return (
			this.message.equal(exception.message) &&
			equal_nullish_values(this.cause, exception.cause, (a, b) => a.equal(b))
		);
	}

	public override toType(): TYPE.Exception {
		return TYPE.EXCP;
	}
}
