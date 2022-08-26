import {OBJ} from './package.js';
import {Type} from './Type.js';



/**
 * Class for constructing the `str` type.
 * @final
 */
export class TypeString extends Type {
	static get INSTANCE(): TypeString { return new TypeString(); }
	override readonly isBottomType: boolean = false;
	override readonly isTopType:    boolean = false;
	private constructor() {
		super(false, new Set([new OBJ.String('')]));
	}
	override toString(): string {
		return 'str';
	}
	override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.String;
	}
}
