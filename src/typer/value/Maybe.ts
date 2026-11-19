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
 * A `Maybe` repesents presence or absence of a value.
 * Known subclasses:
 * - None
 * - Some
 */
export abstract class Maybe extends Value {
}



export class None extends Maybe {
	public constructor(private readonly type: TYPE.Type) {
		super();
	}


	public override toString(): string {
		return `<None instance ${(0x00).toString(16)}>`; // TODO: interpreter object ids
	}

	@strictEqual
	@identical
	@memoizeBinOp(true, true)
	@instanceOf(() => None)
	public override equal(_value: Value): boolean {
		return true;
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.None with the given type argument.
	 */
	public override toType(): TYPE.Maybe {
		return new TYPE.None(this.type);
	}
}



export class Some<T extends Value = Value> extends Maybe {
	public constructor(public readonly value: T) {
		super();
	}


	public override toString(): string {
		return `<Some instance ${(0x00).toString(16)}>`; // TODO: interpreter object ids
	}

	@strictEqual
	@identical
	@memoizeBinOp(true, true)
	@instanceOf(() => Some)
	public override equal(value: Value): boolean {
		return this.value.equal((value as Some).value);
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.Some whose type argument is the type of this Some’s value.
	 */
	public override toType(): TYPE.Maybe {
		return new TYPE.Some(this.value.toType());
	}
}
