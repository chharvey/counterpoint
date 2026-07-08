import {Keyword} from '../../index.ts';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import {
	subtypeLaws,
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
		super(new Set<VALUE.Map>([new VALUE.Map()]), is_mutable);
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.typearg_ant.hasMutable || this.typearg_con.hasMutable;
	}

	public override toString(): string {
		return `${ this.isMutable ? `${ Keyword.MUTABLE } ` : '' }Map.<${ this.typearg_ant }, ${ this.typearg_con }>`;
	}

	@instanceOf(() => VALUE.Map)
	public override includes(v: VALUE.Value): boolean {
		return v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
	@isObjectType
	@instanceOf(() => TypeMap)
	public override isSubtypeOf(t: Type): boolean {
		return t.isMutable
			? this.typearg_ant.equals((t as TypeMap).typearg_ant)      && this.typearg_con.equals((t as TypeMap).typearg_con)       // Invariance for   mutable maps: `A == C && B == D --> mut Map.<A, B> <: mut Map.<C, D>`.
			: this.typearg_ant.isSubtypeOf((t as TypeMap).typearg_ant) && this.typearg_con.isSubtypeOf((t as TypeMap).typearg_con); // Covariance for immutable maps: `A <: C && B <: D -->     Map.<A, B> <:     Map.<C, D>`.
	}

	public override mutableOf(): TypeMap {
		return new TypeMap(this.typearg_ant, this.typearg_con, true);
	}

	public override immutableOf(): TypeMap {
		return new TypeMap(this.typearg_ant, this.typearg_con, false);
	}
}
export {TypeMap as Map};
