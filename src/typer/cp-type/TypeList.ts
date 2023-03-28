import {strictEqual} from '../../lib/index.js';
import * as OBJ from '../cp-object/index.js';
import {OBJ as TYPE_OBJ} from './index.js';
import {Type} from './Type.js';



export class TypeList extends Type {
	public override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeList object.
	 * @param invariant a union of types in this list type
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly invariant: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new OBJ.List()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.invariant.hasMutable;
	}

	public override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }List.<${ this.invariant }>`;
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.List && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		return t.equals(TYPE_OBJ) || (
			t instanceof TypeList
			&& (!t.isMutable || this.isMutable)
			&& ((t.isMutable)
				? this.invariant.equals(t.invariant)      // Invariance for mutable lists: `A == B --> mutable List.<A> <: mutable List.<B>`.
				: this.invariant.isSubtypeOf(t.invariant) // Covariance for immutable lists: `A <: B --> List.<A> <: List.<B>`.
			)
		);
	}

	public override mutableOf(): TypeList {
		return new TypeList(this.invariant, true);
	}

	public override immutableOf(): TypeList {
		return new TypeList(this.invariant, false);
	}
}
