import {
	VoidError01,
	AST,
} from './package.js';
import type {Object} from './Object.js';
import {Null} from './Null.js';
import type {Integer} from './Integer.js';
import {Collection} from './Collection.js';



/**
 * Known subclasses:
 * - Tuple
 * - List
 */
export abstract class CollectionIndexed<T extends Object = Object> extends Collection {
	constructor(
		readonly items: readonly T[] = [],
	) {
		super();
	}

	/** @final */
	override get isEmpty(): boolean {
		return this.items.length === 0;
	}

	override toString(): string {
		return `[${ this.items.map((it) => it.toString()).join(', ') }]`;
	}

	/** @final */
	protected override equal_helper(value: Object): boolean {
		return (
			value instanceof CollectionIndexed
			&& this.items.length === value.items.length
			&& Collection.do_Equal<CollectionIndexed>(this, value, () => (value as CollectionIndexed).items.every(
				(thatitem, i) => this.items[i].equal(thatitem),
			))
		);
	}

	/** @final */
	get(index: Integer, access_optional: boolean, accessor: AST.ASTNodeIndex | AST.ASTNodeExpression): T | Null {
		const n: number = this.items.length;
		const i: number = Number(index.toNumeric());
		return (
			(-n <= i && i < 0) ? this.items[i + n] :
			(0  <= i && i < n) ? this.items[i] :
			(access_optional) ? Null.NULL :
			(() => { throw new VoidError01(accessor); })()
		);
	}
}
