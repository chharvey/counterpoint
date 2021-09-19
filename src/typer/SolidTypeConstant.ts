import {strictEqual} from './package.js';
import type {SolidObject} from './index.js';
import {SolidType} from './SolidType.js';



/**
 * Class for constructing constant types / unit types, types that contain one value.
 */
export class SolidTypeConstant extends SolidType {
	override readonly isBottomType: boolean = false;
	override readonly isTopType: boolean = false;

	constructor (readonly value: SolidObject) {
		super(new Set([value]))
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
		return t instanceof Function && this.value instanceof t || t.includes(this.value)
	}
}
