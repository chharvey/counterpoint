import {
	strictEqual,
	OBJ,
} from './package.js';
import {Type} from './Type.js';



/**
 * Class for constructing the Bottom Type, the type containing no values.
 * @final
 */
export class TypeNever extends Type {
	public static readonly INSTANCE: TypeNever = new TypeNever();

	public override readonly isBottomType: boolean = true;
	public override readonly isTopType:    boolean = false;

	private constructor() {
		super(false);
	}

	public override toString(): string {
		return 'never';
	}

	public override includes(_v: OBJ.Object): boolean {
		return false;
	}

	/** 1-5 | `T  & never   == never` */
	public override intersect(_: Type): Type {
		return this;
	}

	/** 1-7 | `T \| never   == T` */
	public override union(t: Type): Type {
		return t;
	}

	/** 1-1 | `never <: T` */
	public override isSubtypeOf(_: Type): boolean {
		return true;
	}

	@strictEqual
	public override equals(t: Type): boolean {
		return t.isBottomType;
	}
}
