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
 * @final
 */
export class Maybe<T extends Value = Value> extends Value {
	private readonly type:   TYPE.Type;
	public  readonly value?: T;


	public constructor(value_or_type: T | TYPE.Type) {
		super();
		this.type = value_or_type instanceof Value ? value_or_type.toType() : value_or_type;
		if (value_or_type instanceof Value) {
			this.value = value_or_type;
		}
	}


	public override readonly isReference = true;

	public override get isTruthy(): boolean {
		return !this.isNone;
	}

	public get isNone(): boolean {
		return !this.value;
	}


	public override toString(): string {
		return `<Maybe instance ${ (0x00).toString(16) }>`; // TODO: interpreter object ids
	}

	@strictEqual
	@identical
	@memoizeBinOp(true, true)
	@instanceOf(() => Maybe)
	public override equal(value: Value): boolean {
		const maybe = value as Maybe;
		return (
			this.isNone && maybe.isNone ||
			!!this.value && !!maybe.value && this.value.equal(maybe.value)
		);
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.Maybe whose type argument is the type of this Maybe’s value (defaulting to `anything`).
	 */
	public override toType(): TYPE.Maybe {
		return new TYPE.Maybe(this.type);
	}
}
