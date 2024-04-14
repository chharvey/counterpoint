import {strictEqual} from '../../lib/index.js';
import type * as OBJ from '../cp-object/index.js';
import type {Type} from './Type.js';
import {ValueType} from './ValueType.js';



/**
 * Class for constructing the Bottom Type, the type containing no values.
 * @final
 */
export class TypeNever extends ValueType {
	public static readonly INSTANCE = new TypeNever();


	private constructor() {
		super(false);
	}

	public override get isBottomType(): boolean {
		return true;
	}

	public override toString(): string {
		return 'never';
	}

	public override includes(_v: OBJ.Object): boolean {
		return false;
	}

	public override intersect(_: Type): Type {
		/* 1-5 | `T  & never   == never` */
		return this;
	}

	public override union(t: Type): Type {
		/* 1-7 | `T \| never   == T` */
		return t;
	}

	public override isSubtypeOf(_: Type): boolean {
		/* 1-1 | `never <: T` */
		return true;
	}

	@strictEqual
	public override equals(t: Type): boolean {
		return t.isBottomType;
	}
}
