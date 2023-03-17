import {strictEqual} from '../../lib/index.js';
import type * as OBJ from '../cp-object/index.js';
import {NEVER} from './index.js';
import {Type} from './Type.js';



/**
 * Class for constructing the `void` type.
 * @final
 */
export class TypeVoid extends Type {
	public static readonly INSTANCE = new TypeVoid();


	public override readonly isBottomType: boolean = false;
	public override readonly isTopType:    boolean = false;

	private constructor() {
		super(false);
	}

	public override toString(): string {
		return 'void';
	}

	public override includes(_v: OBJ.Object): boolean {
		return false;
	}

	@Type.intersectDeco
	public override intersect(_t: Type): Type {
		return NEVER;
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(_t: Type): boolean {
		return false;
	}

	@strictEqual
	public override equals(t: Type): boolean {
		return t === TypeVoid.INSTANCE || super.equals(t);
	}
}
