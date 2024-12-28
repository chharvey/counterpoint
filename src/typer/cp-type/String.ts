import * as VALUE from '../cp-value/index.js';
import {ValueType} from './ValueType.js';



/**
 * Class for constructing the `str` type.
 * @final
 */
export class TypeString extends ValueType {
	public constructor() {
		super(false, new Set([new VALUE.String('')]));
	}

	public override toString(): string {
		return 'str';
	}

	public override includes(v: VALUE.Value): boolean {
		return v instanceof VALUE.String;
	}
}
