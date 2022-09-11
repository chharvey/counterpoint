import type {SolidObject} from './index.js';
import {SolidType} from './SolidType.js';



/**
 * Class for constructing unit types, types that contain exactly one value.
 * @typeparam Value the type of value this unit type holds
 */
export class SolidTypeUnit<Value extends SolidObject = SolidObject> extends SolidType {
	override readonly isBottomType: boolean = false;
	override readonly isTopType:    boolean = false;

	/**
	 * Construct a new SolidTypeUnit object.
	 * @param value the Solid Language Value contained in this Type
	 */
	constructor (
		readonly value: Value,
	) {
		super(false, new Set([value]));
	}

	override toString(): string {
		return this.value.toString();
	}
	override includes(v: SolidObject): boolean {
		return this.value.identical(v);
	}
	protected override isSubtypeOf_do(t: SolidType): boolean {
		return t.includes(this.value);
	}
}
