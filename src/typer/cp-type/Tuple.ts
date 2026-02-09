import * as assert from 'node:assert';
import {TypeErrorNoEntry} from '../../index.ts';
import type {
	ValidAccessOperator,
	AST,
} from '../../validator/index.ts';
import type {EntryType} from '../utils-public.ts';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../cp-value/index.ts';
import {updateAccessedStaticType} from './utils-private.ts';
import {
	subtypeRules,
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
	 * @param invariants this type’s item types
	 */
	public constructor(public readonly invariants: readonly EntryType[] = []) {
		super(false, new Set([new VALUE.Tuple()]));
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
	@subtypeRules
	@instanceOf(() => TypeTuple)
	public override isSubtypeOf(t: Type): boolean {
		return (
			this.minCount >= (t as TypeTuple).minCount &&
			(t as TypeTuple).invariants.every((thattype, i) => {
				/* eslint-disable @typescript-eslint/no-unnecessary-condition */
				const thistype: EntryType | undefined = this.invariants[i];
				if (!thattype.optional) {
					/* NOTE: We can assert `thistype` exists and is not optional because of item ordering.
						We cannot do so with record types since properties are not ordered. */
					assert.strictEqual(thistype?.optional, false, `${ thistype.type } should exist and not be optional.`);
				}
				return thistype?.type.isSubtypeOf(thattype.type) ?? true; // Covariance for tuples: `A <: B --> Tuple.<A> <: Tuple.<B>`.
			})
		);
	}

	public get(index: VALUE.Integer, access_kind: ValidAccessOperator, accessor: AST.ASTNodeIndexType | AST.ASTNodeIndex | AST.ASTNodeExpression): Type {
		const normalized: bigint | undefined = this.canonicalizeIndex(BigInt(index.toNumber())); // TODO: v0.5: use `index.toBigInt()`
		if (normalized === undefined) {
			throw new TypeErrorNoEntry('index', this, accessor);
		}
		return updateAccessedStaticType(this.invariants[Number(normalized)], access_kind);
	}

	public itemTypes(): Type {
		return Union.all(this.invariants.map((t) => t.type));
	}

	public canonicalizeIndex(index: bigint): bigint | undefined {
		const n: bigint = BigInt(this.invariants.length);
		return (
			(-n <= index && index < 0) ? index + n :
			(0  <= index && index < n) ? index :
			undefined
		);
	}
}
export {TypeTuple as Tuple};
