import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import {EXCP} from './index.ts';
import {
	subtypeLaws,
	disjointLaws,
	type Type,
} from './Type.ts';
import {
	isObjectType,
	ReferenceType,
} from './ReferenceType.ts';



/**
 * A `Result` repesents a success or failure.
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
		return (
			this.typeargSuccess.isSubtypeOf((t as Result).typeargSuccess) &&
			this.typeargFailure.isSubtypeOf((t as Result).typeargFailure)
		); // Result is always covariant under both type args
	}

	/** @final */
	public override mutableOf(): Type {
		return this;
	}
}



export class Fail extends Result {
	public override toString(): string {
		return `Fail[${this.typeargSuccess}, ${this.typeargFailure}]`;
	}

	public override isSubtypeOf(t: Type): boolean {
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		return !(t instanceof Ok) && super.isSubtypeOf(t);
	}

	@memoizeBinOp(true)
	@disjointLaws
	public override isDisjointWith(t: Type): boolean {
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		if (t instanceof Ok) {
			return true;
		}
		return super.isDisjointWith_do(t);
	}
}



export class Ok extends Result {
	public override toString(): string {
		return `Ok[${this.typeargSuccess}, ${this.typeargFailure}]`;
	}

	public override isSubtypeOf(t: Type): boolean {
		return !(t instanceof Fail) && super.isSubtypeOf(t);
	}

	@memoizeBinOp(true)
	@disjointLaws
	public override isDisjointWith(t: Type): boolean {
		if (t instanceof Fail) {
			return true;
		}
		return super.isDisjointWith_do(t);
	}
}
