import {OBJ} from './package.js';
import {Type} from './Type.js';



/**
 * Class for constructing the `bool` type.
 * @final
 */
export class TypeBoolean extends Type {
	static readonly INSTANCE = new TypeBoolean();
	override readonly isBottomType: boolean = false;
	override readonly isTopType:    boolean = false;
	private constructor () {
		super(false, new Set([OBJ.Boolean.FALSE, OBJ.Boolean.TRUE]));
	}
	override toString(): string {
		return 'bool';
	}
	override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Boolean;
	}
}
