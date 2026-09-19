import * as xjs from 'extrajs';
import {TYPE} from '../index.ts';
import {
	language_values_identical,
	language_values_equal,
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import {NULL} from './index.ts';
import {
	identical,
	type Value,
} from './Value.ts';
import type {Null} from './Null.ts';
import {Collection} from './Collection.ts';



/**
 * A dynamic unordered association of value–value pairs.
 * @final
 */
class ValueMap<K extends Value = Value, V extends Value = Value> extends Collection {
	public override readonly isReference = true;

	#cases: Map<K, V>;


	public constructor(cases: ReadonlyMap<K, V> = new Map()) {
		super();
		this.#cases = new Map<K, V>();
		cases.forEach((con, ant) => {
			xjs.Map.set(this.#cases, ant, con, language_values_identical);
		});
	}

	/**
	 * @implements Value
	 */
	public override get isEmpty(): boolean {
		return this.#cases.size === 0;
	}

	/**
	 * @implements Collection
	 */
	public override get count(): bigint {
		return BigInt(this.#cases.size);
	}

	public get cases(): Map<K, V> {
		return new Map([...this.#cases]);
	}

	public override toString(): string {
		return `{${ [...this.#cases].map(([ant, con]) => `${ ant } -> ${ con }`).join(', ') }}`;
	}

	@strictEqual
	@identical
	@memoizeBinOp(true, true)
	@instanceOf(() => ValueMap)
	public override equal(value: Value): boolean {
		return (
			this.#cases.size === (value as ValueMap).#cases.size &&
			[...(value as ValueMap).#cases].every(([thatant, thatcon]) => !!xjs.Map.get<Value, Value>(this.#cases, thatant, language_values_equal)?.equal(thatcon))
		);
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.Map whose type arguments are the respective unions of the types of this ValueMap’s antecedents and consequents.
	 */
	public override toType(): TYPE.Map {
		return new TYPE.Map(
			TYPE.Union.all(...this.#cases.keys()   .map<TYPE.Type>((ant) => ant.toType())),
			TYPE.Union.all(...this.#cases.values() .map<TYPE.Type>((con) => con.toType())),
		);
	}

	public get(ant: Value): V | Null {
		return xjs.Map.get<Value, V>(this.#cases, ant, language_values_identical) ?? NULL;
	}

	public set(ant: K, con: V): void {
		this.#cases.set(ant, con);
	}

	public clear(): void {
		this.#cases = new Map<K, V>();
	}
}
export {ValueMap as Map};
