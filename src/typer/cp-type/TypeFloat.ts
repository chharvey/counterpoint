import {OBJ} from './package.js';
import {Type} from './Type.js';



/**
 * Class for constructing the `float` type.
 * @final
 */
export class TypeFloat extends Type {
	static readonly INSTANCE = new TypeFloat();
	override readonly isBottomType: boolean = false;
	override readonly isTopType:    boolean = false;
	private constructor () {
		super(false, new Set([new OBJ.Float(0.0)]));
	}
	override toString(): string {
		return 'float';
	}
	override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Float;
	}
}
