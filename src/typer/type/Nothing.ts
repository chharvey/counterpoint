import {Keyword} from '../../index.ts';
import {
	strictEqual,
	memoizeBinOp,
} from '../utils-private.ts';
import type * as VALUE from '../value/index.ts';
import type {Type} from './Type.ts';
import {ValueType} from './ValueType.ts';



/**
 * Class for constructing the Bottom Type, the type containing no values.
 * @final
 */
export class Nothing extends ValueType {
	public constructor() {
		super();
	}

	public override get isBottomType(): boolean {
		return true;
	}

	public override toString(): string {
		return Keyword.NOTHING;
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
