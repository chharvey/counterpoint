import {
	TypeError04,
	IntRange,
	ValidAccessOperator,
	AST,
} from './package.js';
import {
	SolidObject,
	Int16,
	SolidTuple,
} from './index.js';
import type {TypeEntry} from './utils-public.js';
import {updateAccessedStaticType} from './utils-private.js';
import {SolidType} from './SolidType.js';
import {SolidTypeUnit} from './SolidTypeUnit.js';



export class SolidTypeTuple extends SolidType {
	/**
	 * Is the argument a unit tuple type?
	 * @return whether the argument is a `SolidTypeUnit` and its value is a `SolidTuple`
	 */
	static isUnitType(type: SolidType): type is SolidTypeUnit<SolidTuple> {
		return type instanceof SolidTypeUnit && type.value instanceof SolidTuple;
	}


	override readonly isBottomType: boolean = false;

	/**
	 * Construct a new SolidTypeTuple from type items, assuming each item is required.
	 * @param types the types of the tuple
	 * @param is_mutable is the tuple type mutable?
	 * @return a new tuple type with the provided items
	 */
	static fromTypes(types: readonly SolidType[] = [], is_mutable: boolean = false): SolidTypeTuple {
		return new SolidTypeTuple(types.map((t) => ({
			type:     t,
			optional: false,
		})), is_mutable);
	}


	/**
	 * Construct a new SolidTypeTuple object.
	 * @param types this type’s item types
	 * @param is_mutable is this type mutable?
	 */
	constructor (
		public readonly types: readonly TypeEntry[] = [],
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new SolidTuple()]));
	}

	override get hasMutable(): boolean {
		return super.hasMutable || this.types.some((t) => t.type.hasMutable);
	}

	/** The possible number of items in this tuple type. */
	public get count(): IntRange {
		return [
			BigInt(this.types.filter((it) => !it.optional).length),
			BigInt(this.types.length) + 1n,
		];
	}

	override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }[${ this.types.map((it) => `${ it.optional ? '?: ' : '' }${ it.type }`).join(', ') }]`;
	}

	override includes(v: SolidObject): boolean {
		return v instanceof SolidTuple && v.toType().isSubtypeOf(this);
	}

	protected override isSubtypeOf_do(t: SolidType): boolean {
		return t.equals(SolidType.OBJ) || (
			t instanceof SolidTypeTuple
			&& this.count[0] >= t.count[0]
			&& (!t.isMutable || this.isMutable)
			&& t.types.every((thattype, i) => !this.types[i] || ((t.isMutable)
				? this.types[i].type.equals(thattype.type)
				: this.types[i].type.isSubtypeOf(thattype.type)
			))
		);
	}

	override mutableOf(): SolidTypeTuple {
		return new SolidTypeTuple(this.types, true);
	}

	override immutableOf(): SolidTypeTuple {
		return new SolidTypeTuple(this.types, false);
	}

	get(index: Int16, access_kind: ValidAccessOperator, accessor: AST.ASTNodeIndexType | AST.ASTNodeIndex | AST.ASTNodeExpression): SolidType {
		const n: number = this.types.length;
		const i: number = Number(index.toNumeric());
		return updateAccessedStaticType((
			(-n <= i && i < 0) ? this.types[i + n] :
			(0  <= i && i < n) ? this.types[i] :
			(() => { throw new TypeError04('index', this, accessor); })()
		), access_kind);
	}

	itemTypes(): SolidType {
		return (this.types.length)
			? SolidType.unionAll(this.types.map((t) => t.type))
			: SolidType.NEVER;
	}

	/**
	 * The *intersection* of types `S` and `T` is the *union* of the set of items on `S` with the set of items on `T`.
	 * For any overlapping items, their type intersection is taken.
	 */
	intersectWithTuple(t: SolidTypeTuple): SolidTypeTuple {
		const items: TypeEntry[] = [...this.types];
		[...t.types].forEach((typ, i) => {
			items[i] = this.types[i] ? {
				type:     this.types[i].type.intersect(typ.type),
				optional: this.types[i].optional && typ.optional,
			} : typ;
		});
		return new SolidTypeTuple(items);
	}

	/**
	 * The *union* of types `S` and `T` is the *intersection* of the set of items on `S` with the set of items on `T`.
	 * For any overlapping items, their type union is taken.
	 */
	unionWithTuple(t: SolidTypeTuple): SolidTypeTuple {
		const items: TypeEntry[] = [];
		t.types.forEach((typ, i) => {
			if (this.types[i]) {
				items[i] = {
					type:     this.types[i].type.union(typ.type),
					optional: this.types[i].optional || typ.optional,
				};
			}
		})
		return new SolidTypeTuple(items);
	}
}
