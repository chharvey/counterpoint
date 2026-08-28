import {Keyword} from '../../index.ts';
import {
	strictEqual,
	memoizeBinOp,
} from '../utils-private.ts';
import type * as VALUE from '../value/index.ts';
import {Type} from './Type.ts';



/**
 * Class for constructing the Bottom Type, the type containing no values.
 * @final
 */
export class Nothing extends Type {
	public constructor() {
		super();
	}

	public override get isBottomType(): boolean {
		return true;
	}

	public override get isReference(): boolean {
		return false;
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

	public override mutableOf(): Type {
		return this;
	}
}
