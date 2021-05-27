import {SolidLanguageType} from '../validator/SolidLanguageType'; // TODO circular imports



export class SolidTypeRecord extends SolidLanguageType {
	/** @overrides SolidLanguageType */
	readonly isEmpty: boolean = false;

	/**
	 * Construct a new SolidTypeRecord object.
	 * @param propertytypes a map of this type’s property ids along with their associated types
	 */
	constructor (
		private readonly propertytypes: ReadonlyMap<bigint, SolidLanguageType> = new Map(),
	) {
		super();
	}

	/** @overrides Object */
	toString(): string {
		return `[${ [...this.propertytypes].map(([key, value]) => `${ key }: ${ value }`).join(', ') }]`;
	}

	/** @overrides SolidLanguageType */
	isSubtypeOf_do(t: SolidTypeRecord): boolean {
		if (t instanceof SolidTypeRecord) {
			if (this.propertytypes.size < t.propertytypes.size) {
				return false;
			};
			return [...t.propertytypes].every(([id, thattype]) => {
				const thistype: SolidLanguageType | null = this.propertytypes.get(id) || null;
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
