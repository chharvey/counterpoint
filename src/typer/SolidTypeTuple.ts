import type {AST} from '../validator/index.js';
import {TypeError04} from '../error/index.js';
import {
	SolidObject,
	Int16,
	SolidTuple,
} from '../index.js'; // avoids circular imports
import {
	TypeEntry,
	IntRange,
	SolidType,
} from './SolidType.js';



export class SolidTypeTuple extends SolidType {
	override readonly isEmpty: boolean = false;

	/**
	 * Construct a new SolidTypeTuple from type items, assuming each item is required.
	 * @param types the types of the tuple
	 * @return a new tuple type with the provided items
	 */
	static fromTypes(types: readonly SolidType[] = []): SolidTypeTuple {
		return new SolidTypeTuple(types.map((t) => ({
			type:     t,
			optional: false,
		})));
	}


	/**
	 * Construct a new SolidTypeTuple object.
	 * @param types this type’s item types
	 */
	constructor (
		private readonly types: readonly TypeEntry[] = [],
	) {
		super(new Set([new SolidTuple()]));
	}

	/** The possible number of items in this tuple type. */
	private get count(): IntRange {
		return [
			this.types.filter((it) => !it.optional).length,
			this.types.length + 1,
		];
	}

	override toString(): string {
		return `[${ this.types.map((t) => t.toString()).join(', ') }]`;
	}

	override includes(v: SolidObject): boolean {
		return v instanceof SolidTuple && v.toType().isSubtypeOf(this);
	}

	override isSubtypeOf_do(t: SolidType): boolean {
		return t.equals(SolidObject) || (
			t instanceof SolidTypeTuple
			&& this.count[0] >= t.count[0]
			&& t.types.every((thattype, i) => !this.types[i] || this.types[i].type.isSubtypeOf(thattype.type))
		);
	}

	get(index: Int16, accessor: AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression): SolidType {
		const n: number = this.types.length;
		const i: number = Number(index.toNumeric());
		return (
			(-n <= i && i < 0) ? this.types[i + n].type :
			(0  <= i && i < n) ? this.types[i].type :
			(() => { throw new TypeError04('index', this, accessor); })()
		);
	}

	itemTypes(): SolidType {
		return this.types.map((t) => t.type).reduce((a, b) => a.union(b));
	}
}
