import {strictEqual} from '../../lib/index.js';
import type {TypeEntry} from '../utils-public.js';
import * as OBJ from '../cp-object/index.js';
import {OBJ as TYPE_OBJ} from './index.js';
import {Type} from './Type.js';
import {TypeUnit} from './TypeUnit.js';
import {TypeCollectionIndexedStatic} from './TypeCollectionIndexedStatic.js';



export class TypeVect extends TypeCollectionIndexedStatic {
	/**
	 * Is the argument a unit vect type?
	 * @return whether the argument is a `TypeUnit` and its value is a `Vect`
	 */
	public static isUnitType(type: Type): type is TypeUnit<OBJ.Vect> {
		return type instanceof TypeUnit && type.value instanceof OBJ.Vect;
	}

	/**
	 * Construct a new TypeVect from type items, assuming each item is required.
	 * @param types the types of the vect
	 * @return a new vect type with the provided items
	 */
	public static fromTypes(types: readonly Type[] = []): TypeVect {
		return new TypeVect(types.map((t) => ({
			type:     t,
			optional: false,
		})));
	}


	/**
	 * Construct a new TypeVect object.
	 * @param invariants this type’s item types
	 */
	public constructor(invariants: readonly TypeEntry[] = []) {
		super(invariants, false, new Set([new OBJ.Vect()]));
	}

	public override get hasMutable(): boolean {
		return false;
	}

	public override toString(): string {
		return `\\[${ super.toString() }]`;
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Vect && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		return t.equals(TYPE_OBJ) || (
			t instanceof TypeVect
			&& this.count[0] >= t.count[0]
			&& t.invariants.every((thattype, i) => !this.invariants[i] || (
				this.invariants[i].type.isSubtypeOf(thattype.type) // Covariance for vects: `A <: B --> Vect.<A> <: Vect.<B>`.
			))
		);
	}
}
