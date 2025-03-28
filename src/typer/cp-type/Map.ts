import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.js';
import * as VALUE from '../cp-value/index.js';
import {MUT_OPERATOR} from './utils-private.js';
import {
	subtypeRules,
	type Type,
} from './Type.js';
import {
	isObjectType,
	ReferenceType,
} from './ReferenceType.js';



/**
 * Class for constructing a `Map` type.
 * @final
 */
class TypeMap extends ReferenceType {
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
		super(is_mutable, new Set([new VALUE.Map()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.invariant_ant.hasMutable || this.invariant_con.hasMutable;
	}

	public override toString(): string {
		return `${ (this.isMutable) ? MUT_OPERATOR : '' }Map.<${ this.invariant_ant }, ${ this.invariant_con }>`;
	}

	public override includes(v: VALUE.Value): boolean {
		return v instanceof VALUE.Map && v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeRules
	@isObjectType
	@instanceOf(() => TypeMap)
	public override isSubtypeOf(t: Type): boolean {
		return (
			(!t.isMutable || this.isMutable) &&
			(t.isMutable
				? this.invariant_ant.equals((t as TypeMap).invariant_ant) && this.invariant_con.equals((t as TypeMap).invariant_con)      // Invariance for mutable maps: `A == C && B == D --> mut Map.<A, B> <: mut Map.<C, D>`.
				: this.invariant_ant.equals((t as TypeMap).invariant_ant) && this.invariant_con.isSubtypeOf((t as TypeMap).invariant_con) // Invariance for immutable maps’ keys: `A == C && --> Map.<A, B> <: Map.<C, B>`. // Covariance for immutable maps’ values: `B <: D --> Map.<A, B> <: Map.<A, D>`.
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
export {TypeMap as Map};
