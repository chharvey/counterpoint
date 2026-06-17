import {NULL} from './index.ts';
import type {Value} from './Value.ts';
import type {Null} from './Null.ts';
import {Collection} from './Collection.ts';



/**
 * Known subclasses:
 * - ValueRecord
 * - Dict
 */
export abstract class CollectionKeyed<T extends Value = Value> extends Collection {
	protected static samenessDfn<T extends Value = Value>(
		a:          CollectionKeyed<T>,
		b:          CollectionKeyed<T>,
		comparator: (a: T, b: T) => boolean,
	): boolean {
		return (
			a.#properties === b.#properties ||
			a.#properties.size === b.#properties.size &&
			[...b.#properties].every(([thatkey, thatvalue]) => a.#properties.has(thatkey) && comparator(a.#properties.get(thatkey)!, thatvalue))
		);
	}


	#properties: Map<bigint, T>;


	public constructor(properties: ReadonlyMap<bigint, T> = new Map()) {
		super();
		this.#properties = new Map<bigint, T>([...properties]);
	}

	/**
	 * @final
	 * @implements Value
	 */
	public override get isEmpty(): boolean {
		return this.#properties.size === 0;
	}

	/**
	 * @final
	 * @implements Collection
	 */
	public override get count(): bigint {
		return BigInt(this.#properties.size);
	}

	public get properties(): Map<bigint, T> {
		return new Map([...this.#properties]);
	}

	public override toString(): string {
		return [...this.#properties].map(([key, value]) => `${ key }n= ${ value }`).join(', ');
	}

	/** @final */
	public get(key: bigint): T | Null {
		return this.#properties.get(key) ?? NULL;
	}

	public set(key: bigint, value: T): void {
		this.#properties.set(key, value);
	}

	public clear(): void {
		this.#properties = new Map<bigint, T>();
	}
}
