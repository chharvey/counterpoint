import {SolidType} from './SolidType.js';



export class SolidTypeRecord extends SolidType {
	override readonly isEmpty: boolean = false;

	/**
	 * Construct a new SolidTypeRecord object.
	 * @param propertytypes a map of this type’s property ids along with their associated types
	 */
	constructor (
		private readonly propertytypes: ReadonlyMap<bigint, SolidType> = new Map(),
	) {
		super();
	}

	override toString(): string {
		return `[${ [...this.propertytypes].map(([key, value]) => `${ key }: ${ value }`).join(', ') }]`;
	}

	override isSubtypeOf_do(t: SolidTypeRecord): boolean {
		if (t instanceof SolidTypeRecord) {
			if (this.propertytypes.size < t.propertytypes.size) {
				return false;
			};
			return [...t.propertytypes].every(([id, thattype]) => {
				const thistype: SolidType | null = this.propertytypes.get(id) || null;
				if (!thistype) {
					return false;
				};
				return thistype.isSubtypeOf(thattype);
			});
		} else {
			return false;
		};
	}
}
