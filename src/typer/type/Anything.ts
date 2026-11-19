import {Keyword} from '../../index.ts';
import {
	strictEqual,
	memoizeBinOp,
} from '../utils-private.ts';
import {Type} from './Type.ts';



/**
 * Class for constructing the Top Type, the type containing all values.
 * @singleton
 * @final
 */
export class Anything extends Type {
	public constructor() {
		super();
	}

	public override get isTopType(): boolean {
		return true;
	}

	public override toString(): string {
		return Keyword.ANYTHING;
	}

	public override includes(): boolean {
		return true;
	}

	@strictEqual
	@memoizeBinOp(true)
	public override equals(t: Type): boolean {
		return t.isTopType;
	}
}
