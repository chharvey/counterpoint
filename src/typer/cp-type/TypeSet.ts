import {OBJ as VALUE} from './package.js';
import {Type} from './Type.js';
import {TypeUnit} from './TypeUnit.js';
import {OBJ} from './index.js';



export class TypeSet extends Type {
	/**
	 * Is the argument a unit set type?
	 * @return whether the argument is a `TypeUnit` and its value is a `Set`
	 */
	public static isUnitType(type: Type): type is TypeUnit<VALUE.Set> {
		return type instanceof TypeUnit && type.value instanceof VALUE.Set;
	}


	public override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeSet object.
	 * @param invariant a union of types in this set type
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly invariant: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new VALUE.Set()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.invariant.hasMutable;
	}

	public override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }Set.<${ this.invariant }>`;
	}

	public override includes(v: VALUE.Object): boolean {
		return v instanceof VALUE.Set && v.toType().isSubtypeOf(this);
	}

	protected override isSubtypeOf_do(t: Type): boolean {
		return t.equals(OBJ) || (
			t instanceof TypeSet
			&& ((t.isMutable)
				? this.isMutable && this.invariant.equals(t.invariant)
				: this.invariant.isSubtypeOf(t.invariant)
			)
		);
	}

	public override mutableOf(): TypeSet {
		return new TypeSet(this.invariant, true);
	}

	public override immutableOf(): TypeSet {
		return new TypeSet(this.invariant, false);
	}
}
