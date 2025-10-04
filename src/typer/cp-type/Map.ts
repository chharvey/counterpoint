import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../cp-value/index.ts';
import {MUT_OPERATOR} from './utils-private.ts';
import {
	subtypeRules,
	type Type,
} from './Type.ts';
import {
	isObjectType,
	ReferenceType,
} from './ReferenceType.ts';



/**
 * Class for constructing a `Map` type.
 * @final
 */
class TypeMap extends ReferenceType {
	/**
	 * Construct a new TypeMap object.
	 * @param typearg_ant a union of antecedent types in this map type
	 * @param typearg_con a union of consequent types in this map type
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly typearg_ant: Type,
		public readonly typearg_con: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new VALUE.Map()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.typearg_ant.hasMutable || this.typearg_con.hasMutable;
	}

	public override toString(): string {
		return `${ (this.isMutable) ? MUT_OPERATOR : '' }Map.<${ this.typearg_ant }, ${ this.typearg_con }>`;
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
				? this.typearg_ant.equals((t as TypeMap).typearg_ant) && this.typearg_con.equals((t as TypeMap).typearg_con)      // Invariance for mutable maps: `A == C && B == D --> mut Map.<A, B> <: mut Map.<C, D>`.
				: this.typearg_ant.equals((t as TypeMap).typearg_ant) && this.typearg_con.isSubtypeOf((t as TypeMap).typearg_con) // Invariance for immutable maps’ antecedents: `A == C && --> Map.<A, B> <: Map.<C, B>`. // Covariance for immutable maps’ consequents: `B <: D --> Map.<A, B> <: Map.<A, D>`.
			)
		);
	}

	public override mutableOf(): TypeMap {
		return new TypeMap(this.typearg_ant, this.typearg_con, true);
	}

	public override immutableOf(): TypeMap {
		return new TypeMap(this.typearg_ant, this.typearg_con, false);
	}
}
export {TypeMap as Map};
