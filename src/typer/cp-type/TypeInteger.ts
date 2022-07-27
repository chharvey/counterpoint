import {OBJ} from './package.js';
import {Type} from './Type.js';



/**
 * Class for constructing the `int` type.
 * @final
 */
export class TypeInteger extends Type {
	static get INSTANCE(): TypeInteger { return new TypeInteger(); }
	override readonly isBottomType: boolean = false;
	override readonly isTopType:    boolean = false;
	private constructor () {
		super(false, new Set([OBJ.Int16.ZERO]));
	}
	override toString(): string {
		return 'int';
	}
	override includes(v: OBJ.SolidObject): boolean {
		return v instanceof OBJ.Int16;
	}
}
