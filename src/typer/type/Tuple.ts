import * as assert from 'node:assert';
import {
	TypeErrorNoEntry,
	type AST,
} from '../../index.ts';
import type {EntryType} from '../utils-public.ts';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import {
	subtypeLaws,
	type Type,
} from './Type.ts';
import {Union} from './Union.ts';
import {ValueType} from './ValueType.ts';



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


	/**
	 * Construct a new TypeTuple object.
	 * @param typeargs this type’s item types
	 */
	public constructor(public readonly typeargs: readonly EntryType[] = []) {
		super(new Set<VALUE.Tuple>([VALUE.TUPLE_EMPTY]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.typeargs.some((t) => t.type.hasMutable);
	}

	/** The minimum possible number of items in this tuple type. */
	public get minCount(): bigint {
		return BigInt(this.typeargs.filter((it) => !it.optional).length);
	}

	public override toString(): string {
		return `(${ this.typeargs.map((it) => `${ it.optional ? '?: ' : '' }${ it.type }`).join(', ') }${ this.typeargs.length === 1 ? ',' : '' })`;
	}

	@instanceOf(() => VALUE.Tuple)
	public override includes(v: VALUE.Value): boolean {
		return v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
	@instanceOf(() => TypeTuple)
	public override isSubtypeOf(t: Type): boolean {
		return (
			this.minCount >= (t as TypeTuple).minCount &&
			(t as TypeTuple).typeargs.every((thattype, i) => {
				const thistype: EntryType | undefined = this.typeargs.at(i);
				if (!thattype.optional) {
					/* NOTE: We can assert `thistype` exists and is not optional because of item ordering.
						We cannot do so with record types since properties are not ordered. */
					assert.strictEqual(thistype?.optional, false, `${ thistype!.type } should exist and not be optional.`);
				}
				return thistype?.type.isSubtypeOf(thattype.type) ?? true; // Covariance for tuples: `A <: B --> Tuple.<A> <: Tuple.<B>`.
			})
		);
	}

	public get(index: bigint, accessor: AST.Index): EntryType {
		return this.isIndexCanonical(index)
			? this.typeargs.at(Number(index))!
			: assert.fail(new TypeErrorNoEntry('index', this, accessor));
	}

	public set(index: bigint, typ: Type, accessor: AST.Index): void {
		const i: number = Number(index);
		const entrytype: EntryType | undefined = this.typeargs.at(i);
		if (entrytype) {
			(this.typeargs as EntryType[])[i] = {...entrytype, type: typ};
		} else {
			throw new TypeErrorNoEntry('index', this, accessor);
		}
	}

	public itemTypes(): Type {
		return Union.all(...this.typeargs.map((t) => t.type));
	}

	public isIndexCanonical(index: bigint): boolean {
		return 0 <= index && index < this.typeargs.length;
	}
}
export {TypeTuple as Tuple};
