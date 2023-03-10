import {strictEqual} from '../../lib/index.js';
import type * as OBJ from '../cp-object/index.js';
import {Type} from './Type.js';



/**
 * Class for constructing the Top Type, the type containing all values.
 * @final
 */
export class TypeUnknown extends Type {
	public static readonly INSTANCE: TypeUnknown = new TypeUnknown();

	public override readonly isBottomType: boolean = false;
	public override readonly isTopType:    boolean = true;

	private constructor() {
		super(false);
	}

	public override toString(): string {
		return 'unknown';
	}

	public override includes(_v: OBJ.Object): boolean {
		return true;
	}

	public override intersect(t: Type): Type {
		/** 1-6 | `T  & unknown == T` */
		return t;
	}

	public override union(_: Type): Type {
		/** 1-8 | `T \| unknown == unknown` */
		return this;
	}

	public override isSubtypeOf(t: Type): boolean {
		/** 1-4 | `unknown <: T      <->  T == unknown` */
		return t.isTopType;
	}

	@strictEqual
	public override equals(t: Type): boolean {
		return t.isTopType;
	}
}
