import type binaryen from 'binaryen';
import {
	VoidError01,
	AST,
} from './package.js';
import type {SolidObject} from './SolidObject.js';
import {SolidNull} from './SolidNull.js';
import type {Int16} from './Int16.js';
import {Collection} from './Collection.js';



/**
 * Known subclasses:
 * - SolidTuple
 * - SolidList
 */
export abstract class CollectionIndexed<T extends SolidObject = SolidObject> extends Collection {
	constructor (
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
	protected override equal_helper(value: SolidObject): boolean {
		return (
			value instanceof CollectionIndexed
			&& this.items.length === value.items.length
			&& Collection.do_Equal<CollectionIndexed>(this, value, () => (value as CollectionIndexed).items.every(
				(thatitem, i) => this.items[i].equal(thatitem),
			))
		);
	}

	public override build(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.tuple.make(this.items.map((item) => item.build(mod)));
	}

	/** @final */
	get(index: Int16, access_optional: boolean, accessor: AST.ASTNodeIndex | AST.ASTNodeExpression): T | SolidNull {
		const n: number = this.items.length;
		const i: number = index.toNumber();
		return (
			(-n <= i && i < 0) ? this.items[i + n] :
			(0  <= i && i < n) ? this.items[i] :
			(access_optional) ? SolidNull.NULL :
			(() => { throw new VoidError01(accessor); })()
		);
	}
}
