import type binaryen from 'binaryen';
import {
	VoidError01,
	throw_expression,
	strictEqual,
	AST,
} from './package.js';
import {Object as CPObject} from './Object.js';
import {Null} from './Null.js';
import type {Integer} from './Integer.js';
import {Collection} from './Collection.js';



/**
 * Known subclasses:
 * - Tuple
 * - List
 */
export abstract class CollectionIndexed<T extends CPObject = CPObject> extends Collection {
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
	@CPObject.equalsDeco
	public override equal(value: CPObject): boolean {
		return (
			value instanceof CollectionIndexed
			&& this.items.length === value.items.length
			&& Collection.do_Equal<CollectionIndexed>(this, value, () => (
				value.items.every((thatitem, i) => (
					this.items[i].equal(thatitem)
				))
			))
		);
	}

	public override build(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.tuple.make(this.items.map((item) => item.build(mod)));
	}

	/** @final */
	public get(index: Integer, access_optional: boolean, accessor: AST.ASTNodeIndex | AST.ASTNodeExpression): T | Null {
		const n: number = this.items.length;
		const i: number = Number(index.toNumeric());
		return (
			(-n <= i && i < 0) ? this.items[i + n] :
			(0  <= i && i < n) ? this.items[i] :
			(access_optional) ? Null.NULL :
			throw_expression(new VoidError01(accessor))
		);
	}
}
