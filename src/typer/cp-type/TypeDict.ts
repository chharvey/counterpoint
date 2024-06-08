import {strictEqual} from '../../lib/index.js';
import * as OBJ from '../cp-object/index.js';
import {OBJ as TYPE_OBJ} from './index.js';
import {MUT_OPERATOR} from './utils-private.js';
import {Type} from './Type.js';



export class TypeDict extends Type {
	public override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeDict object.
	 * @param invariant a union of types in this dict type
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly invariant: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new OBJ.Dict()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.invariant.hasMutable;
	}

	public override toString(): string {
		return `${ (this.isMutable) ? MUT_OPERATOR : '' }Dict.<${ this.invariant }>`;
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Dict && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		return t.equals(TYPE_OBJ) || (
			t instanceof TypeDict
			&& (!t.isMutable || this.isMutable)
			&& ((t.isMutable)
				? this.invariant.equals(t.invariant)      // Invariance for mutable dicts: `A == B --> mut Dict.<A> <: mut Dict.<B>`.
				: this.invariant.isSubtypeOf(t.invariant) // Covariance for immutable dicts: `A <: B --> Dict.<A> <: Dict.<B>`.
			)
		);
	}

	public override mutableOf(): TypeDict {
		return new TypeDict(this.invariant, true);
	}

	public override immutableOf(): TypeDict {
		return new TypeDict(this.invariant, false);
	}
}
