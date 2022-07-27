import {
	SolidObject,
	SolidBoolean,
} from './package.js';
import {Type} from './Type.js';



/**
 * Class for constructing the `bool` type.
 * @final
 */
export class SolidTypeBoolean extends Type {
	static get INSTANCE(): SolidTypeBoolean { return new SolidTypeBoolean(); }
	override readonly isBottomType: boolean = false;
	override readonly isTopType:    boolean = false;
	private constructor () {
		super(false, new Set([SolidBoolean.FALSE, SolidBoolean.TRUE]));
	}
	override toString(): string {
		return 'bool';
	}
	override includes(v: SolidObject): boolean {
		return v instanceof SolidBoolean;
	}
}
