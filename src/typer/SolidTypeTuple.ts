import {
	strictEqual,
} from '../decorators';
import {SolidLanguageType} from '../validator/SolidLanguageType'; // TODO circular imports
import {SolidObject} from '../validator/SolidObject';
import {SolidTuple} from './SolidTuple';



export class SolidTypeTuple extends SolidLanguageType {
	override readonly isEmpty: boolean = false;

	/**
	 * Construct a new SolidTypeTuple object.
	 * @param types this type’s item types
	 */
	constructor (
		private readonly types: readonly SolidLanguageType[] = [],
	) {
		super(new Set([new SolidTuple()]));
	}

	override toString(): string {
		return `[${ this.types.map((t) => t.toString()).join(', ') }]`;
	}

	@strictEqual
	@SolidLanguageType.subtypeDeco
	override isSubtypeOf(t: SolidLanguageType): boolean {
		return (
			(t.equals(SolidObject)) ? true :
			(t instanceof SolidTypeTuple) ? ((this.types.length < t.types.length)
				? false
				: t.types.every((thattype, i) => this.types[i].isSubtypeOf(thattype))
			) :
			false
		);
	}
}
