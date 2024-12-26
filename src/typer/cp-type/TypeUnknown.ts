import {
	strictEqual,
	memoizeBinOp,
} from '../../lib/index.js';
import type * as VALUE from '../cp-value/index.js';
import type {Type} from './Type.js';
import {ReferenceType} from './ReferenceType.js';



/**
 * Class for constructing the Top Type, the type containing all values.
 * @final
 */
export class TypeUnknown extends ReferenceType {
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

	public override includes(_v: VALUE.Value): boolean {
		return true;
	}

	@strictEqual
	@memoizeBinOp(true)
	public override equals(t: Type): boolean {
		return t.isTopType;
	}
}
