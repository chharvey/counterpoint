import {Keyword} from '../../index.ts';
import {
	strictEqual,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import type {Type} from './Type.ts';
import {ReferenceType} from './ReferenceType.ts';



/**
 * Class for constructing the Top Type, the type containing all values.
 * @final
 */
export class Anything extends ReferenceType {
	public constructor() {
		super(new Set<VALUE.Value>([
			VALUE.NULL,
			VALUE.FALSE,
			VALUE.TRUE,
			VALUE.INT_0,
			VALUE.INT_1,
			VALUE.FLOAT_0,
			VALUE.FLOAT_N0,
			VALUE.STR_EMPTY,
			VALUE.TUPLE_EMPTY,
			VALUE.RECORD_EMPTY,
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
		return Keyword.ANYTHING;
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
