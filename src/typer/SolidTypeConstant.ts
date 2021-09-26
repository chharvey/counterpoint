import type {SolidObject} from './index.js';
import {SolidType} from './SolidType.js';



/**
 * Class for constructing constant types / unit types, types that contain one value.
 */
export class SolidTypeConstant extends SolidType {
	override readonly isBottomType: boolean = false;
	override readonly isTopType: boolean = false;

	/**
	 * Construct a new SolidTypeConstant object.
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
	override isSubtypeOf_do(t: SolidType): boolean {
		return t instanceof Function && this.value instanceof t || t.includes(this.value)
	}
}
