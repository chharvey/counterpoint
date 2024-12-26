import * as assert from 'assert';
import * as xjs from 'extrajs';
import {VoidError01} from '../../index.js';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../../lib/index.js';
import type {AST} from '../../validator/index.js';
import {language_values_equal} from '../utils-private.js';
import {equalsDeco} from './decorators.js';
import type {Value} from './Value.js';
import {Null} from './Null.js';
import type {Integer} from './Integer.js';
import {Collection} from './Collection.js';



/**
 * Known subclasses:
 * - Tuple
 * - List
 */
export abstract class CollectionIndexed<T extends Value = Value> extends Collection {
	public constructor(public readonly items: readonly T[] = []) {
		super();
	}

	/** @final */
	public override get isEmpty(): boolean {
		return this.items.length === 0;
	}

	public override toString(): string {
		return `[${ this.items.map((it) => it.toString()).join(', ') }]`;
	}

	/** @final */
	@strictEqual
	@equalsDeco
	@instanceOf(() => CollectionIndexed)
	@memoizeBinOp(true, true)
	public override equal(value: Value): boolean {
		return xjs.Array.is<Value>(this.items, (value as CollectionIndexed).items, language_values_equal);
	}

	/** @final */
	public get(index: Integer, access_optional: boolean, accessor: AST.ASTNodeIndex | AST.ASTNodeExpression): T | Null {
		const n: number = this.items.length;
		const i: number = index.toNumber();
		return (
			(-n <= i && i < 0) ? this.items[i + n] :
			(0  <= i && i < n) ? this.items[i] :
			(access_optional) ? Null.NULL :
			assert.fail(new VoidError01(accessor))
		);
	}
}
