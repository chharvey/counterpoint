import {
	TypeError04,
	IntRange,
	throw_expression,
	ValidAccessOperator,
	AST,
	TypeEntry,
	OBJ,
} from './package.js';
import {updateAccessedStaticType} from './utils-private.js';
import {Type} from './Type.js';



export class TypeTuple extends Type {
	override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeTuple from type items, assuming each item is required.
	 * @param types the types of the tuple
	 * @param is_mutable is the tuple type mutable?
	 * @return a new tuple type with the provided items
	 */
	static fromTypes(types: readonly Type[] = [], is_mutable: boolean = false): TypeTuple {
		return new TypeTuple(types.map((t) => ({
			type:     t,
			optional: false,
		})), is_mutable);
	}


	/**
	 * Construct a new TypeTuple object.
	 * @param types this type’s item types
	 * @param is_mutable is this type mutable?
	 */
	constructor(
		private readonly types: readonly TypeEntry[] = [],
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new OBJ.Tuple()]));
	}

	override get hasMutable(): boolean {
		return super.hasMutable || this.types.some((t) => t.type.hasMutable);
	}

	/** The possible number of items in this tuple type. */
	private get count(): IntRange {
		return [
			BigInt(this.types.filter((it) => !it.optional).length),
			BigInt(this.types.length) + 1n,
		];
	}

	override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }[${ this.types.map((it) => `${ it.optional ? '?: ' : '' }${ it.type }`).join(', ') }]`;
	}

	override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Tuple && v.toType().isSubtypeOf(this);
	}

	protected override isSubtypeOf_do(t: Type): boolean {
		return t.equals(Type.OBJ) || (
			t instanceof TypeTuple
			&& this.count[0] >= t.count[0]
			&& (!t.isMutable || this.isMutable)
			&& t.types.every((thattype, i) => !this.types[i] || ((t.isMutable)
				? this.types[i].type.equals(thattype.type)
				: this.types[i].type.isSubtypeOf(thattype.type)
			))
		);
	}

	override mutableOf(): TypeTuple {
		return new TypeTuple(this.types, true);
	}

	override immutableOf(): TypeTuple {
		return new TypeTuple(this.types, false);
	}

	get(index: OBJ.Integer, access_kind: ValidAccessOperator, accessor: AST.ASTNodeIndexType | AST.ASTNodeIndex | AST.ASTNodeExpression): Type {
		const n: number = this.types.length;
		const i: number = Number(index.toNumeric());
		return updateAccessedStaticType((
			(-n <= i && i < 0) ? this.types[i + n] :
			(0  <= i && i < n) ? this.types[i] :
			throw_expression(new TypeError04('index', this, accessor))
		), access_kind);
	}

	itemTypes(): Type {
		return (this.types.length)
			? Type.unionAll(this.types.map((t) => t.type))
			: Type.NEVER;
	}

	/**
	 * The *intersection* of types `S` and `T` is the *union* of the set of items on `S` with the set of items on `T`.
	 * For any overlapping items, their type intersection is taken.
	 */
	intersectWithTuple(t: TypeTuple): TypeTuple {
		const items: TypeEntry[] = [...this.types];
		[...t.types].forEach((typ, i) => {
			items[i] = this.types[i] ? {
				type:     this.types[i].type.intersect(typ.type),
				optional: this.types[i].optional && typ.optional,
			} : typ;
		});
		return new TypeTuple(items);
	}

	/**
	 * The *union* of types `S` and `T` is the *intersection* of the set of items on `S` with the set of items on `T`.
	 * For any overlapping items, their type union is taken.
	 */
	unionWithTuple(t: TypeTuple): TypeTuple {
		const items: TypeEntry[] = [];
		t.types.forEach((typ, i) => {
			if (this.types[i]) {
				items[i] = {
					type:     this.types[i].type.union(typ.type),
					optional: this.types[i].optional || typ.optional,
				};
			}
		})
		return new TypeTuple(items);
	}
}
