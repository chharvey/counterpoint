import {
	strictEqual,
	SolidObject,
} from './package.js';
import {SolidType} from './SolidType.js';



/**
 * Class for constructing unit types, types that contain exactly one value.
 */
export class SolidTypeUnit extends SolidType {
	override readonly isBottomType: boolean = false;
	override readonly isTopType:    boolean = false;

	/**
	 * Construct a new SolidTypeUnit object.
	 * @param value the Solid Language Value contained in this Type
	 */
	constructor (
		readonly value: SolidObject,
	) {
		super(false, new Set([value]));
	}

	override toString(): string {
		return this.value.toString();
	}
	override includes(v: SolidObject): boolean {
		return this.value.identical(v);
	}
	@strictEqual
	@SolidType.subtypeDeco
	override isSubtypeOf(t: SolidType): boolean {
		return t.includes(this.value);
	}
}
