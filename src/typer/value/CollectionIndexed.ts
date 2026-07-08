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
			a.items === b.items ||
			a.items.length === b.items.length &&
			b.items.every((thatvalue, i) => comparator.call(null, a.items[i], thatvalue))
		);
	}


	public constructor(public readonly items: readonly T[] = []) {
		super();
	}

	/**
	 * @final
	 * @implements Value
	 */
	public override get isEmpty(): boolean {
		return this.items.length === 0;
	}

	/**
	 * @final
	 * @implements Collection
	 */
	public override get count(): bigint {
		return BigInt(this.items.length);
	}

	public override toString(): string {
		return this.items.map((it) => it.toString()).join(', ');
	}

	/** @final */
	public get(index: bigint, is_access_maybe: boolean, accessor: AST.Index | AST.EXPR.Expression): T | Null {
		return 0 <= index && index < this.items.length
			? this.items.at(Number(index))!
			: is_access_maybe ? NULL : assert.fail(new VoidErrorOutOfBounds('index', this, index, accessor));
	}
}
