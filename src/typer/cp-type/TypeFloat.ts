import {OBJ} from './package.js';
import {Type} from './Type.js';



/**
 * Class for constructing the `float` type.
 * @final
 */
export class TypeFloat extends Type {
	static get INSTANCE(): TypeFloat { return new TypeFloat(); }
	override readonly isBottomType: boolean = false;
	override readonly isTopType:    boolean = false;
	private constructor () {
		super(false, new Set([new OBJ.Float(0.0)]));
	}
	override toString(): string {
		return 'int';
	}
	override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Float;
	}
}
