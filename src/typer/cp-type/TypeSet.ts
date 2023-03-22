import {strictEqual} from '../../lib/index.js';
import * as OBJ from '../cp-object/index.js';
import {OBJ as TYPE_OBJ} from './index.js';
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
	 * @param invariant a union of types in this set type
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly invariant: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new OBJ.Set()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.invariant.hasMutable;
	}

	public override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }Set.<${ this.invariant }>`;
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Set && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		return t.equals(TYPE_OBJ) || (
			t instanceof TypeSet
			&& (!t.isMutable || this.isMutable)
			&& ((t.isMutable)
				? this.invariant.equals(t.invariant)      // Invariance for mutable sets: `A == B --> mutable Set.<A> <: mutable Set.<B>`.
				: this.invariant.isSubtypeOf(t.invariant) // Covariance for immutable sets: `A <: B --> Set.<A> <: Set.<B>`.
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
