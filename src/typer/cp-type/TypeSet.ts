import {OBJ as VALUE} from './package.js';
import {Type} from './Type.js';
import {TypeUnit} from './TypeUnit.js';
import {OBJ} from './index.js';



export class TypeSet extends Type {
	/**
	 * Is the argument a unit set type?
	 * @return whether the argument is a `TypeUnit` and its value is a `Set`
	 */
	static isUnitType(type: Type): type is TypeUnit<VALUE.Set> {
		return type instanceof TypeUnit && type.value instanceof VALUE.Set;
	}


	override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeSet object.
	 * @param types a union of types in this set type
	 * @param is_mutable is this type mutable?
	 */
	constructor (
		public readonly types: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new VALUE.Set()]));
	}

	override get hasMutable(): boolean {
		return super.hasMutable || this.types.hasMutable;
	}

	override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }Set.<${ this.types }>`;
	}

	override includes(v: VALUE.Object): boolean {
		return v instanceof VALUE.Set && v.toType().isSubtypeOf(this);
	}

	protected override isSubtypeOf_do(t: Type): boolean {
		return t.equals(OBJ) || (
			t instanceof TypeSet
			&& ((t.isMutable)
				? this.isMutable && this.types.equals(t.types)
				: this.types.isSubtypeOf(t.types)
			)
		);
	}

	override mutableOf(): TypeSet {
		return new TypeSet(this.types, true);
	}

	override immutableOf(): TypeSet {
		return new TypeSet(this.types, false);
	}
}
