import {
	INST,
	Builder,
	VoidError01,
	throw_expression,
	AST,
} from './package.js';
import type {Object as CPObject} from './Object.js';
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
	protected override equal_helper(value: CPObject): boolean {
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

	public override build(builder: Builder): INST.InstructionExpression {
		return new INST.InstructionTupleMake(this.items.map((item) => item.build(builder)));
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
