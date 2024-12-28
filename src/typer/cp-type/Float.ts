import {instanceOf} from '../../lib/decorators.js';
import * as VALUE from '../cp-value/index.js';
import {ValueType} from './ValueType.js';



/**
 * Class for constructing the `float` type.
 * @final
 */
export class TypeFloat extends ValueType {
	public constructor() {
		super(false, new Set([new VALUE.Float(0.0)]));
	}

	public override toString(): string {
		return 'float';
	}

	@instanceOf(() => VALUE.Float)
	public override includes(_: VALUE.Value): boolean {
		return true;
	}
}
