import {
	SolidObject,
	SolidString,
} from './package.js';
import {Type} from './Type.js';



/**
 * Class for constructing the `str` type.
 * @final
 */
export class TypeString extends Type {
	static get INSTANCE(): TypeString { return new TypeString(); }
	override readonly isBottomType: boolean = false;
	override readonly isTopType:    boolean = false;
	private constructor () {
		super(false, new Set([new SolidString('')]));
	}
	override toString(): string {
		return 'str';
	}
	override includes(v: SolidObject): boolean {
		return v instanceof SolidString;
	}
}
