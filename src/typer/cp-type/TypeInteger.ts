import {
	SolidObject,
	Int16,
} from './package.js';
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
		super(false, new Set([Int16.ZERO]));
	}
	override toString(): string {
		return 'int';
	}
	override includes(v: SolidObject): boolean {
		return v instanceof Int16;
	}
}
