import type {AST} from '../validator/index.js';
import {TypeError04} from '../error/index.js';
import {SolidType} from './SolidType.js';
import {SolidObject} from './SolidObject.js';
import {Int16} from './Int16.js';
import {SolidTuple} from './SolidTuple.js';



export class SolidTypeTuple extends SolidType {
	override readonly isEmpty: boolean = false;

	/**
	 * Construct a new SolidTypeTuple object.
	 * @param types this type’s item types
	 */
	constructor (
		private readonly types: readonly SolidType[] = [],
	) {
		super(new Set([new SolidTuple()]));
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
			&& this.types.length >= t.types.length
			&& t.types.every((thattype, i) => this.types[i].isSubtypeOf(thattype))
		);
	}

	get(index: Int16, accessor: AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression): SolidType {
		return ((index.eq0() || Int16.ZERO.lt(index)) && index.lt(new Int16(BigInt(this.types.length))))
			? this.types[Number(index.toNumeric())]
			: (() => { throw new TypeError04('index', this, accessor); })();
	}

	itemTypes(): SolidType {
		return this.types.reduce((a, b) => a.union(b));
	}
}
