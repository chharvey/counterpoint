import {strictEqual} from '../../lib/index.js';
import type * as OBJ from '../cp-object/index.js';
import {NEVER} from './index.js';
import {
	memoizeIntersection,
	memoizeSubtype,
	intersectDeco,
	subtypeDeco,
} from './decorators.js';
import type {Type} from './Type.js';
import {ValueType} from './ValueType.js';



/**
 * Class for constructing the `void` type.
 * @final
 */
export class TypeVoid extends ValueType {
	public static readonly INSTANCE = new TypeVoid();


	private constructor() {
		super(false);
	}

	public override toString(): string {
		return 'void';
	}

	public override includes(_v: OBJ.Object): boolean {
		return false;
	}

	@memoizeIntersection
	// @operatorDeco // slower than returning a constant
	@intersectDeco
	public override intersect(_t: Type): Type {
		return NEVER;
	}

	@strictEqual
	@memoizeSubtype
	@subtypeDeco
	public override isSubtypeOf(_t: Type): boolean {
		return false;
	}

	@strictEqual
	public override equals(t: Type): boolean {
		return t === TypeVoid.INSTANCE || super.equals(t);
	}
}
