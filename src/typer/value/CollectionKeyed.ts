import * as assert from 'node:assert';
import {
	VoidErrorOutOfBounds,
	type AST,
} from '../../index.ts';
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
			a.properties === b.properties ||
			a.properties.size === b.properties.size &&
			[...b.properties].every(([thatkey, thatvalue]) => a.properties.has(thatkey) && comparator.call(null, a.properties.get(thatkey)!, thatvalue))
		);
	}


	public constructor(public readonly properties: ReadonlyMap<bigint, T> = new Map()) {
		super();
	}

	/**
	 * @final
	 * @implements Value
	 */
	public override get isEmpty(): boolean {
		return this.properties.size === 0;
	}

	/**
	 * @final
	 * @implements Collection
	 */
	public override get count(): bigint {
		return BigInt(this.properties.size);
	}

	public override toString(): string {
		return [...this.properties].map(([key, value]) => `${ key }n= ${ value }`).join(', ');
	}

	/** @final */
	public get(key: bigint, is_access_maybe: boolean, accessor: AST.Key | AST.EXPR.Expression): T | Null {
		return this.properties.has(key)
			? this.properties.get(key)!
			: is_access_maybe ? NULL : assert.fail(new VoidErrorOutOfBounds('key', this, key, accessor));
	}
}
