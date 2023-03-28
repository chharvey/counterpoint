import {TypeErrorNoEntry} from '../../index.js';
import {
	type IntRange,
	throw_expression,
} from '../../lib/index.js';
import type {
	ValidAccessOperator,
	AST,
} from '../../validator/index.js';
import type {TypeEntry} from '../utils-public.js';
import type * as OBJ from '../cp-object/index.js';
import {updateAccessedStaticType} from './utils-private.js';
import {Type} from './Type.js';



/**
 * Known subclasses:
 * - TypeTuple
 * - TypeVect
 */
export abstract class TypeCollectionIndexedStatic extends Type {
	public override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeCollectionIndexedStatic object.
	 * @param invariants this type’s item types
	 * @param is_mutable is this type mutable?
	 */
	public constructor(
		public readonly invariants: readonly TypeEntry[],
		is_mutable:                 boolean,
		initial_values:             ReadonlySet<OBJ.Object>,
	) {
		super(is_mutable, initial_values);
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.invariants.some((t) => t.type.hasMutable);
	}

	/**
	 * The possible number of items in this static indexed collection type.
	 * @final
	 */
	public get count(): IntRange {
		return [
			BigInt(this.invariants.filter((it) => !it.optional).length),
			BigInt(this.invariants.length) + 1n,
		];
	}

	public override toString(): string {
		return this.invariants.map((it) => `${ it.optional ? '?: ' : '' }${ it.type }`).join(', ');
	}

	/** @final */
	public get(index: OBJ.Integer, access_kind: ValidAccessOperator, accessor: AST.ASTNodeIndexType | AST.ASTNodeIndex | AST.ASTNodeExpression): Type {
		const n: number = this.invariants.length;
		const i: number = Number(index.toNumeric());
		return updateAccessedStaticType(
			(
				(-n <= i && i < 0) ? this.invariants[i + n] :
				(0  <= i && i < n) ? this.invariants[i]     :
				throw_expression(new TypeErrorNoEntry('index', this, accessor))
			),
			access_kind,
		);
	}

	/** @final */
	public itemTypes(): Type {
		return Type.unionAll(this.invariants.map((t) => t.type));
	}
}
