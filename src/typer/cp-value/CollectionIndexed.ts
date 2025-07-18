import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {VoidError01} from '../../index.ts';
import type {AST} from '../../validator/index.ts';
import {
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
import type {Integer} from './Integer.ts';
import {Collection} from './Collection.ts';



/**
 * Known subclasses:
 * - ValueTuple
 * - List
 */
export abstract class CollectionIndexed<T extends Value = Value> extends Collection {
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
		return `[${ this.items.map((it) => it.toString()).join(', ') }]`;
	}

	/** @final */
	@strictEqual
	@instanceOf(() => CollectionIndexed)
	@identical
	@memoizeBinOp(true, true)
	public override equal(value: Value): boolean {
		return xjs.Array.is<Value>(this.items, (value as CollectionIndexed).items, language_values_equal);
	}

	/** @final */
	public get(index: Integer, access_optional: boolean, accessor: AST.ASTNodeIndex | AST.ASTNodeExpression): T | Null {
		const n: number = this.items.length;
		const i: number = index.toNumber();
		return (
			-n <= i && i < 0 ? this.items[i + n] :
			0  <= i && i < n ? this.items[i] :
			access_optional  ? NULL :
			assert.fail(new VoidError01(accessor))
		);
	}
}
