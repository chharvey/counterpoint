import {SolidType} from './SolidType';



export class SolidTypeTuple extends SolidType {
	override readonly isEmpty: boolean = false;

	/**
	 * Construct a new SolidTypeTuple object.
	 * @param types this type’s item types
	 */
	constructor (
		private readonly types: readonly SolidType[] = [],
	) {
		super();
	}

	override toString(): string {
		return `[${ this.types.map((t) => t.toString()).join(', ') }]`;
	}

	override isSubtypeOf_do(t: SolidType): boolean {
		if (t instanceof SolidTypeTuple) {
			if (this.types.length < t.types.length) {
				return false;
			};
			return t.types.every((thattype, i) => this.types[i].isSubtypeOf(thattype));
		} else {
			return false;
		};
	}
}
