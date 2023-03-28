import {strictEqual} from '../../lib/index.js';
import * as OBJ from '../cp-object/index.js';
import {OBJ as TYPE_OBJ} from './index.js';
import {Type} from './Type.js';



export class TypeMap extends Type {
	public override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeMap object.
	 * @param invariant_ant a union of antecedent types in this map type
	 * @param invariant_con a union of consequent types in this map type
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly invariant_ant: Type,
		public readonly invariant_con: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new OBJ.Map()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.invariant_ant.hasMutable || this.invariant_con.hasMutable;
	}

	public override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }Map.<${ this.invariant_ant }, ${ this.invariant_con }>`;
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Map && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		return t.equals(TYPE_OBJ) || (
			t instanceof TypeMap
			&& (!t.isMutable || this.isMutable)
			&& ((t.isMutable)
				? this.invariant_ant.equals(t.invariant_ant) && this.invariant_con.equals(t.invariant_con)      // Invariance for mutable maps: `A == C && B == D --> mutable Map.<A, B> <: mutable Map.<C, D>`.
				: this.invariant_ant.equals(t.invariant_ant) && this.invariant_con.isSubtypeOf(t.invariant_con) // Invariance for immutable maps’ keys: `A == C && --> Map.<A, B> <: Map.<C, B>`. // Covariance for immutable maps’ values: `B <: D --> Map.<A, B> <: Map.<A, D>`.
			)
		);
	}

	public override mutableOf(): TypeMap {
		return new TypeMap(this.invariant_ant, this.invariant_con, true);
	}

	public override immutableOf(): TypeMap {
		return new TypeMap(this.invariant_ant, this.invariant_con, false);
	}
}
