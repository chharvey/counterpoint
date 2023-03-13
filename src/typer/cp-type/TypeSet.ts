import {OBJ} from './package.js';
import {Type} from './Type.js';
import {TypeUnit} from './TypeUnit.js';



export class TypeSet extends Type {
	/**
	 * Is the argument a unit set type?
	 * @return whether the argument is a `TypeUnit` and its value is a `Set`
	 */
	public static isUnitType(type: Type): type is TypeUnit<OBJ.Set> {
		return type instanceof TypeUnit && type.value instanceof OBJ.Set;
	}


	public override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeSet object.
	 * @param types a union of types in this set type
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly types: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new OBJ.Set()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.types.hasMutable;
	}

	public override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }Set.<${ this.types }>`;
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Set && v.toType().isSubtypeOf(this);
	}

	protected override isSubtypeOf_do(t: Type): boolean {
		return t.equals(Type.OBJ) || (
			t instanceof TypeSet
			&& ((t.isMutable)
				? this.isMutable && this.types.equals(t.types)
				: this.types.isSubtypeOf(t.types)
			)
		);
	}

	public override mutableOf(): TypeSet {
		return new TypeSet(this.types, true);
	}

	public override immutableOf(): TypeSet {
		return new TypeSet(this.types, false);
	}
}
