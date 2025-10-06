import {instanceOf} from '../utils-private.ts';
import * as VALUE from '../cp-value/index.ts';
import {UnenumeratedPrimitiveType} from './UnenumeratedPrimitiveType.ts';



/**
 * Class for constructing the `float` type.
 * @final
 */
export class Float extends UnenumeratedPrimitiveType {
	public constructor() {
		super(false, new Set([VALUE.FLOAT_0, VALUE.FLOAT_N0]));
	}

	public override toString(): string {
		return 'float';
	}

	@instanceOf(() => VALUE.Float)
	public override includes(_: VALUE.Value): boolean {
		return true;
	}
}
