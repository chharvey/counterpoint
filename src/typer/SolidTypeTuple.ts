import {
	strictEqual,
} from '../decorators';
import {SolidType} from './SolidType';
import {SolidObject} from './SolidObject';
import {SolidTuple} from './SolidTuple';



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

	@strictEqual
	@SolidType.subtypeDeco
	override isSubtypeOf(t: SolidType): boolean {
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
