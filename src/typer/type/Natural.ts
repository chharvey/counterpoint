import {Keyword} from '../../index.ts';
import {instanceOf} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import {UnenumeratedPrimitiveType} from './UnenumeratedPrimitiveType.ts';



/**
 * Class for constructing the `nat` type.
 * @final
 */
export class Natural extends UnenumeratedPrimitiveType {
	public constructor() {
		super(new Set<VALUE.Natural>([VALUE.NAT_0, VALUE.NAT_1]));
	}

	public override toString(): string {
		return Keyword.NAT;
	}

	@instanceOf(() => VALUE.Natural)
	public override includes(_: VALUE.Value): boolean {
		return true;
	}
}
