import {
	strictEqual,
	memoizeBinOp,
} from '../../lib/index.js';
import type * as OBJ from '../cp-object/index.js';
import {Type} from './Type.js';



/**
 * Class for constructing the Top Type, the type containing all values.
 * @final
 */
export class TypeUnknown extends Type {
	public static readonly INSTANCE = new TypeUnknown();


	private constructor() {
		super(false);
	}

	public override get isTopType(): boolean {
		return true;
	}

	public override toString(): string {
		return 'unknown';
	}

	public override includes(_v: OBJ.Value): boolean {
		return true;
	}

	@strictEqual
	@memoizeBinOp(true)
	public override equals(t: Type): boolean {
		return t.isTopType;
	}
}
