import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import {EXCP} from './index.ts';
import {
	subtypeLaws,
	type Type,
} from './Type.ts';
import {
	isObjectType,
	ReferenceType,
} from './ReferenceType.ts';



/**
 * Class for constructing a `Result` type.
 * Known subclasses:
 * - Fail
 * - Ok
 */
export class Result extends ReferenceType {
	/**
	 * Constructs a new Result object resembling the `Result[T, E]` type, with the given generic arguments.
	 * @param typeargSuccess the success generic argument
	 * @param typeargFailure the failure generic argument
	 */
	public constructor(
		public readonly typeargSuccess: Type,
		public readonly typeargFailure: Type = EXCP,
	) {
		super();
		if (!typeargFailure.isSubtypeOf(EXCP)) {
			throw new TypeError('Failure type argument to Result must be a subtype of Exception.');
		}
	}


	public override toString(): string {
		return `Result[${this.typeargSuccess}, ${this.typeargFailure}]`;
	}

	@instanceOf(() => VALUE.Result)
	public override includes(v: VALUE.Value): boolean {
		return v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
	@isObjectType
	@instanceOf(() => Result)
	public override isSubtypeOf(t: Type): boolean {
		return this.constructor === t.constructor && (
			this.typeargSuccess.isSubtypeOf((t as Result).typeargSuccess) &&
			this.typeargFailure.isSubtypeOf((t as Result).typeargFailure)
		); // Result is always covariant with both type args
	}

	/** @final */
	public override mutableOf(): this {
		return this;
	}
}



/**
 * Class for constructing a `Fail` type.
 * @final
 */
export class Fail extends Result {
	public override toString(): string {
		return `Fail[${this.typeargSuccess}, ${this.typeargFailure}]`;
	}

	@instanceOf(() => VALUE.Fail)
	public override includes(v: VALUE.Value): boolean {
		return v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
	@isObjectType
	@instanceOf(() => Result)
	public override isSubtypeOf(t: Type): boolean {
		return t instanceof Fail ? (
			this.typeargSuccess.isSubtypeOf(t.typeargSuccess) &&
			this.typeargFailure.isSubtypeOf(t.typeargFailure)
			// Fail is always covariant with both type args
		) : new Result(this.typeargSuccess, this.typeargFailure).isSubtypeOf(t);
	}
}



/**
 * Class for constructing an `Ok` type.
 * @final
 */
export class Ok extends Result {
	public override toString(): string {
		return `Ok[${this.typeargSuccess}, ${this.typeargFailure}]`;
	}

	@instanceOf(() => VALUE.Ok)
	public override includes(v: VALUE.Value): boolean {
		return v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
	@isObjectType
	@instanceOf(() => Result)
	public override isSubtypeOf(t: Type): boolean {
		return t instanceof Ok ? (
			this.typeargSuccess.isSubtypeOf(t.typeargSuccess) &&
			this.typeargFailure.isSubtypeOf(t.typeargFailure)
			// Ok is always covariant with both type args
		) : new Result(this.typeargSuccess, this.typeargFailure).isSubtypeOf(t);
	}
}
