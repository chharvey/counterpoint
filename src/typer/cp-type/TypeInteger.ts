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
	private constructor() {
		super(false, new Set([OBJ.Integer.ZERO]));
	}
	override toString(): string {
		return 'int';
	}
	override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Integer;
	}
}
