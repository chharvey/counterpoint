import * as assert from 'assert';
import {TypeErrorNoEntry} from '../../index.js';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../../lib/index.js';
import type {
	ValidAccessOperator,
	AST,
} from '../../validator/index.js';
import type {TypeEntry} from '../utils-public.js';
import * as VALUE from '../cp-value/index.js';
import {updateAccessedStaticType} from './utils-private.js';
import {subtypeDeco} from './decorators.js';
import type {Type} from './Type.js';
import {Union} from './Union.js';
import {ValueType} from './ValueType.js';



type IndexTree = readonly (number | IndexTree)[];
type MutableIndexTree = Array<number | MutableIndexTree>;



/**
 * Class for constructing tuple literal types.
 * @final
 */
class TypeTuple extends ValueType {
	/**
	 * Construct a new TypeTuple from type items, assuming each item is required.
	 * @param types the types of the tuple
	 * @return a new tuple type with the provided items
	 */
	public static fromTypes(types: readonly Type[] = []): TypeTuple {
		return new TypeTuple(types.map((t) => ({
			type:     t,
			optional: false,
		})));
	}


	readonly #indexTree: IndexTree;

	/**
	 * Construct a new TypeTuple object.
	 * @param invariants this type’s item types
	 */
	public constructor(public readonly invariants: readonly TypeEntry[] = []) {
		super(false, new Set([new VALUE.Tuple()]));

		const tree: MutableIndexTree = [];
		this.#populateIndexTree(tree);
		this.#indexTree = tree;
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.invariants.some((t) => t.type.hasMutable);
	}

	/** The minimum possible number of items in this tuple type. */
	public get minCount(): bigint {
		return BigInt(this.invariants.filter((it) => !it.optional).length);
	}

	public override toString(): string {
		return `[${ this.invariants.map((it) => `${ it.optional ? '?: ' : '' }${ it.type }`).join(', ') }]`;
	}

	@instanceOf(() => VALUE.Tuple)
	public override includes(v: VALUE.Value): boolean {
		return v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeDeco
	@instanceOf(() => TypeTuple)
	public override isSubtypeOf(t: Type): boolean {
		return (
			this.minCount >= (t as TypeTuple).minCount &&
			(t as TypeTuple).invariants.every((thattype, i) => {
				/* eslint-disable @typescript-eslint/no-unnecessary-condition */
				const thistype: TypeEntry | undefined = this.invariants[i];
				if (!thattype.optional) {
					/* NOTE: We can assert `thistype` exists and is not optional because of item ordering.
						We cannot do so with record types since properties are not ordered. */
					assert.strictEqual(thistype?.optional, false, `${ thistype } should exist and not be optional.`);
				}
				return thistype?.type.isSubtypeOf(thattype.type) ?? true; // Covariance for tuples: `A <: B --> Tuple.<A> <: Tuple.<B>`.
			})
		);
	}

	#populateIndexTree(index_tree: MutableIndexTree, start: number = 0): number {
		this.invariants.forEach((child) => {
			if (child.type instanceof TypeTuple) {
				const tree: typeof index_tree = [];
				index_tree.push(tree);
				start = child.type.#populateIndexTree(tree, start);
			} else {
				index_tree.push(start);
				start += 1;
			}
		});
		return start;
	}

	/**
	 * Return an index or list of indices corresponding to the tree structure of this type.
	 * @example
	 * [A, [B], [C, [D]]]                 => [0, [1], [2, 3]]
	 * [A, [B, Bb], [C, [D, Dd], Cc], Aa] => [0, [1, 2], [3, 4, 5, 6], 7]
	 */
	public getFlattenedIndices(index: number): number | number[] {
		const item: number | IndexTree = this.#indexTree[index];
		return typeof item === 'number'
			? item
			// @ts-expect-error --- guaranteed to be finitely recursive
			: item.flat(Infinity);
	}

	/** @final */
	public get(index: VALUE.Integer, access_kind: ValidAccessOperator, accessor: AST.ASTNodeIndexType | AST.ASTNodeIndex | AST.ASTNodeExpression): Type {
		const n: number = this.invariants.length;
		const i: number = index.toNumber();
		return updateAccessedStaticType(
			(
				(-n <= i && i < 0) ? this.invariants[i + n] :
				(0  <= i && i < n) ? this.invariants[i]     :
				assert.fail(new TypeErrorNoEntry('index', this, accessor))
			),
			access_kind,
		);
	}

	/** @final */
	public itemTypes(): Type {
		return Union.all(this.invariants.map((t) => t.type));
	}
}
export {TypeTuple as Tuple};
