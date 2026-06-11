import * as xjs from 'extrajs';
import {TYPE} from '../index.ts';
import {
	language_values_identical,
	language_values_equal,
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import {
	FALSE,
	TRUE,
} from './index.ts';
import {
	identical,
	type Value,
} from './Value.ts';
import type {Boolean as ValueBoolean} from './Boolean.ts';
import {Collection} from './Collection.ts';



/**
 * A dynamic unordered sequence of values.
 * @final
 */
class ValueSet<T extends Value = Value> extends Collection {
	#elements: Set<T>;


	public constructor(elements: ReadonlySet<T> = new Set()) {
		super();
		this.#elements = new Set<T>();
		elements.forEach((el) => {
			xjs.Set.add(this.#elements, el, language_values_identical);
		});
	}

	/**
	 * @implements Value
	 */
	public override get isEmpty(): boolean {
		return this.#elements.size === 0;
	}

	/**
	 * @implements Collection
	 */
	public override get count(): bigint {
		return BigInt(this.#elements.size);
	}

	public get elements(): Set<T> {
		return new Set([...this.#elements]);
	}

	public override toString(): string {
		return `{${ [...this.#elements].map((el) => el.toString()).join(', ') }}`;
	}

	@strictEqual
	@identical
	@memoizeBinOp(true, true)
	@instanceOf(() => ValueSet)
	public override equal(value: Value): boolean {
		return xjs.Set.is<Value>(this.#elements, (value as ValueSet).#elements, language_values_equal);
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.Set whose type argument is the union of the types of this ValueSet’s elements.
	 */
	public override toType(): TYPE.Set {
		return new TYPE.Set(TYPE.Union.all(...[...this.#elements].map<TYPE.Type>((el) => el.toType())));
	}

	public get(el: Value): ValueBoolean {
		return xjs.Set.has<Value>(this.#elements, el, language_values_identical) ? TRUE : FALSE;
	}

	public put(el: T): void {
		this.#elements.add(el);
	}

	public delete(el: T): void {
		this.#elements.delete(el);
	}

	public clear(): void {
		this.#elements = new Set<T>();
	}
}
export {ValueSet as Set};
