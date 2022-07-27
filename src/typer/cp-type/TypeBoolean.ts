import {OBJ} from './package.js';
import {Type} from './Type.js';



/**
 * Class for constructing the `bool` type.
 * @final
 */
export class TypeBoolean extends Type {
	static get INSTANCE(): TypeBoolean { return new TypeBoolean(); }
	override readonly isBottomType: boolean = false;
	override readonly isTopType:    boolean = false;
	private constructor () {
		super(false, new Set([OBJ.SolidBoolean.FALSE, OBJ.SolidBoolean.TRUE]));
	}
	override toString(): string {
		return 'bool';
	}
	override includes(v: OBJ.SolidObject): boolean {
		return v instanceof OBJ.SolidBoolean;
	}
}
