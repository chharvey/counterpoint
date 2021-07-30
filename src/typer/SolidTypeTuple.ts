import {SolidType} from './SolidType.js';
import {SolidObject} from './SolidObject.js';
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
		super(SolidTuple.values);
	}

	override toString(): string {
		return `[${ this.types.map((t) => t.toString()).join(', ') }]`;
	}

	override includes(v: SolidObject): boolean {
		return v instanceof SolidTuple && v.toType().isSubtypeOf(this);
	}

	/**
	 * The *intersection* of types `S` and `T` is the *union* of the set of items on `S` with the set of items on `T`.
	 * For any overlapping items, their type intersection is taken.
	 */
	override intersect_do(t: SolidType): SolidType {
		if (t instanceof SolidTypeTuple) {
			const items: SolidType[] = [...this.types];
			[...t.types].forEach((typ, i) => {
				items[i] = typ.intersect(this.types[i] || SolidType.UNKNOWN);
			});
			return new SolidTypeTuple(items);
		} else {
			return super.intersect_do(t);
		}
	}

	/**
	 * The *union* of types `S` and `T` is the *intersection* of the set of items on `S` with the set of items on `T`.
	 * For any overlapping items, their type union is taken.
	 */
	override union_do(t: SolidType): SolidType {
		if (t instanceof SolidTypeTuple) {
			const items: SolidType[] = [];
			[...t.types].forEach((typ, i) => {
				if (this.types[i]) {
					items[i] = typ.union(this.types[i]);
				}
			})
			return new SolidTypeTuple(items);
		} else {
			return super.union_do(t);
		}
	}

	override isSubtypeOf_do(t: SolidType): boolean {
		return t.equals(SolidObject) || (
			t instanceof SolidTypeTuple
			&& this.types.length >= t.types.length
			&& t.types.every((thattype, i) => this.types[i].isSubtypeOf(thattype))
		);
	}
}
