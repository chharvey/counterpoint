import {
	SolidObject,
	Float64,
} from './package.js';
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
		super(false, new Set([new Float64(0.0)]));
	}
	override toString(): string {
		return 'int';
	}
	override includes(v: SolidObject): boolean {
		return v instanceof Float64;
	}
}
