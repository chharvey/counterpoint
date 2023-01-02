import {TypeError04} from '../../index.js';
import {
	IntRange,
	throw_expression,
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
import {TypeUnit} from './TypeUnit.js';



export class TypeTuple extends Type {
	/**
	 * Is the argument a unit tuple type?
	 * @return whether the argument is a `TypeUnit` and its value is a `Tuple`
	 */
	public static isUnitType(type: Type): type is TypeUnit<OBJ.Tuple> {
		return type instanceof TypeUnit && type.value instanceof OBJ.Tuple;
	}


	public override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeTuple from type items, assuming each item is required.
	 * @param types the types of the tuple
	 * @param is_mutable is the tuple type mutable?
	 * @return a new tuple type with the provided items
	 */
	public static fromTypes(types: readonly Type[] = [], is_mutable: boolean = false): TypeTuple {
		return new TypeTuple(types.map((t) => ({
			type:     t,
			optional: false,
		})), is_mutable);
	}


	/**
	 * Construct a new TypeTuple object.
	 * @param invariants this type’s item types
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly invariants: readonly TypeEntry[] = [],
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new OBJ.Tuple()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.invariants.some((t) => t.type.hasMutable);
	}

	/** The possible number of items in this tuple type. */
	public get count(): IntRange {
		return [
			BigInt(this.invariants.filter((it) => !it.optional).length),
			BigInt(this.invariants.length) + 1n,
		];
	}

	public override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }[${ this.invariants.map((it) => `${ it.optional ? '?: ' : '' }${ it.type }`).join(', ') }]`;
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Tuple && v.toType().isSubtypeOf(this);
	}

	protected override isSubtypeOf_do(t: Type): boolean {
		return t.equals(TYPE_OBJ) || (
			t instanceof TypeTuple
			&& this.count[0] >= t.count[0]
			&& (!t.isMutable || this.isMutable)
			&& t.invariants.every((thattype, i) => !this.invariants[i] || ((t.isMutable)
				? this.invariants[i].type.equals(thattype.type)
				: this.invariants[i].type.isSubtypeOf(thattype.type)
			))
		);
	}

	public override mutableOf(): TypeTuple {
		return new TypeTuple(this.invariants, true);
	}

	public override immutableOf(): TypeTuple {
		return new TypeTuple(this.invariants, false);
	}

	public get(index: OBJ.Integer, access_kind: ValidAccessOperator, accessor: AST.ASTNodeIndexType | AST.ASTNodeIndex | AST.ASTNodeExpression): Type {
		const n: number = this.invariants.length;
		const i: number = Number(index.toNumeric());
		return updateAccessedStaticType(
			(
				(-n <= i && i < 0) ? this.invariants[i + n] :
				(0  <= i && i < n) ? this.invariants[i]     :
				throw_expression(new TypeError04('index', this, accessor))
			),
			access_kind,
		);
	}

	public itemTypes(): Type {
		return Type.unionAll(this.invariants.map((t) => t.type));
	}

	/**
	 * The *intersection* of types `S` and `T` is the *union* of the set of items on `S` with the set of items on `T`.
	 * For any overlapping items, their type intersection is taken.
	 */
	public intersectWithTuple(t: TypeTuple): TypeTuple {
		const items: TypeEntry[] = [...this.invariants];
		[...t.invariants].forEach((typ, i) => {
			items[i] = this.invariants[i] ? {
				type:     this.invariants[i].type.intersect(typ.type),
				optional: this.invariants[i].optional && typ.optional,
			} : typ;
		});
		return new TypeTuple(items);
	}

	/**
	 * The *union* of types `S` and `T` is the *intersection* of the set of items on `S` with the set of items on `T`.
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