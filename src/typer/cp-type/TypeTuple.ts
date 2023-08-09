import * as assert from 'assert';
import {TypeErrorNoEntry} from '../../index.js';
import {
	type IntRange,
	throw_expression,
	strictEqual,
} from '../../lib/index.js';
import type {
	ValidAccessOperator,
	AST,
} from '../../validator/index.js';
import type {TypeEntry} from '../utils-public.js';
import * as OBJ from '../cp-object/index.js';
import {OBJ as TYPE_OBJ} from './index.js';
import {updateAccessedStaticType} from './utils-private.js';
import {Type} from './Type.js';



export class TypeTuple extends Type {
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


	public override readonly isReference: boolean = false;
	public override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeTuple object.
	 * @param invariants this type’s item types
	 */
	public constructor(public readonly invariants: readonly TypeEntry[] = []) {
		super(false, new Set([new OBJ.Tuple()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.invariants.some((t) => t.type.hasMutable);
	}

	/**
	 * The possible number of items in this tuple type.
	 * @final
	 */
	public get count(): IntRange {
		return [
			BigInt(this.invariants.filter((it) => !it.optional).length),
			BigInt(this.invariants.length) + 1n,
		];
	}

	public override toString(): string {
		return `[${ this.invariants.map((it) => `${ it.optional ? '?: ' : '' }${ it.type }`).join(', ') }]`;
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Tuple && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		return t.equals(TYPE_OBJ) || (
			t instanceof TypeTuple
			&& this.count[0] >= t.count[0]
			&& !t.isMutable
			&& t.invariants.every((thattype, i) => {
				/* eslint-disable @typescript-eslint/no-unnecessary-condition */
				const thistype: TypeEntry | undefined = this.invariants[i];
				if (!thattype.optional) {
					/* NOTE: We can assert `thistype` exists and is not optional because of item ordering.
						We cannot do so with record types since properties are not ordered. */
					assert.strictEqual(thistype?.optional, false, `${ thistype } should exist and not be optional.`);
				}
				return !thistype || thistype.type.isSubtypeOf(thattype.type); // Covariance for tuples: `A <: B --> Tuple.<A> <: Tuple.<B>`.
				/* eslint-enable @typescript-eslint/no-unnecessary-condition */
			})
		);
	}

	/** @final */
	public get(index: OBJ.Integer, access_kind: ValidAccessOperator, accessor: AST.ASTNodeIndexType | AST.ASTNodeIndex | AST.ASTNodeExpression): Type {
		const n: number = this.invariants.length;
		const i: number = Number(index.toNumeric());
		return updateAccessedStaticType(
			(
				(-n <= i && i < 0) ? this.invariants[i + n] :
				(0  <= i && i < n) ? this.invariants[i]     :
				throw_expression(new TypeErrorNoEntry('index', this, accessor))
			),
			access_kind,
		);
	}

	/** @final */
	public itemTypes(): Type {
		return Type.unionAll(this.invariants.map((t) => t.type));
	}

	/**
	 * When accessing the *intersection* of types `S` and `T`,
	 * the set of items available is the *union* of the set of items on `S` with the set of items on `T`.
	 * For any overlapping items, their type intersection is taken.
	 */
	public intersectWithTuple(t: TypeTuple): TypeTuple {
		const items: TypeEntry[] = [...this.invariants];
		t.invariants.forEach((typ, i) => {
			items[i] = this.invariants[i] ? {
				type:     this.invariants[i].type.intersect(typ.type),
				optional: this.invariants[i].optional && typ.optional,
			} : typ;
		});
		return new TypeTuple(items);
	}

	/**
	 * When accessing the *union* of types `S` and `T`,
	 * the set of items available is the *intersection* of the set of items on `S` with the set of items on `T`.
	 * For any overlapping items, their type union is taken.
	 */
	public unionWithTuple(t: TypeTuple): TypeTuple {
		const items: TypeEntry[] = [];
		t.invariants.forEach((typ, i) => {
			if (this.invariants[i]) {
				items[i] = {
					type:     this.invariants[i].type.union(typ.type),
					optional: this.invariants[i].optional || typ.optional,
				};
			}
		});
		return new TypeTuple(items);
	}
}
