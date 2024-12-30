import {
	strictEqual,
	memoizeBinOp,
} from '../utils-private.js';
import * as VALUE from '../cp-value/index.js';
import type {Type} from './Type.js';
import {ReferenceType} from './ReferenceType.js';



/**
 * Class for constructing the Top Type, the type containing all values.
 * @final
 */
export class Unknown extends ReferenceType {
	public constructor() {
		super(false, new Set<VALUE.Value>([
			VALUE.NULL,
			VALUE.FALSE,
			VALUE.TRUE,
			VALUE.INT_0,
			VALUE.INT_1,
			VALUE.FLOAT_0,
			VALUE.FLOAT_N0,
			VALUE.STR_EMPTY,
			new VALUE.List(),
			new VALUE.Dict(),
			new VALUE.Set(),
			new VALUE.Map(),
		]));
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
