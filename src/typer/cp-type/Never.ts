import {
	strictEqual,
	memoizeBinOp,
} from '../../lib/index.js';
import type * as VALUE from '../cp-value/index.js';
import type {Type} from './Type.js';
import {ValueType} from './ValueType.js';



/**
 * Class for constructing the Bottom Type, the type containing no values.
 * @final
 */
export class TypeNever extends ValueType {
	public constructor() {
		super(false);
	}

	public override get isBottomType(): boolean {
		return true;
	}

	public override toString(): string {
		return 'never';
	}

	public override includes(_v: VALUE.Value): boolean {
		return false;
	}

	@strictEqual
	@memoizeBinOp(true)
	public override equals(t: Type): boolean {
		return t.isBottomType;
	}
}
