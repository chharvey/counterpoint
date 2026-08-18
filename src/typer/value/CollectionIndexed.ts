import {NULL} from './index.ts';
import type {Value} from './Value.ts';
import type {Null} from './Null.ts';
import {Collection} from './Collection.ts';



/**
 * Known subclasses:
 * - ValueTuple
 * - List
 */
export abstract class CollectionIndexed<T extends Value = Value> extends Collection {
	protected static samenessDfn<T extends Value = Value>(
		a:          CollectionIndexed<T>,
		b:          CollectionIndexed<T>,
		comparator: (a: T, b: T) => boolean,
	): boolean {
		return (
			a.#items === b.#items ||
			a.#items.length === b.#items.length &&
			b.#items.every((thatvalue, i) => comparator(a.#items[i], thatvalue))
		);
	}


	#items: T[];


	public constructor(items: readonly T[] = []) {
		super();
		this.#items = [...items];
	}

	/**
	 * @final
	 * @implements Value
	 */
	public override get isEmpty(): boolean {
		return this.#items.length === 0;
	}

	/**
	 * @final
	 * @implements Collection
	 */
	public override get count(): bigint {
		return BigInt(this.#items.length);
	}

	public get items(): T[] {
		return [...this.#items];
	}

	public override toString(): string {
		return this.#items.map((it) => it.toString()).join(', ');
	}

	/** @final */
	public get(index: bigint): T | Null {
		return this.#items.at(Number(index)) ?? NULL;
	}

	public set(index: bigint, value: T): void {
		this.#items[Number(index)] = value;
	}

	public clear(): void {
		this.#items = [];
	}
}
