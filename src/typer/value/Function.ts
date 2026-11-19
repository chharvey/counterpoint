import type {TYPE} from '../index.ts';
import {Value} from './Value.ts';



/**
 * A Counterpoint function value.
 * @final
 */
class ValueFunction extends Value {
	public constructor(
		private readonly functionType: TYPE.Function,
		private readonly source:       string,
	) {
		super();
	}


	public override toString(): string {
		return this.source;
	}

	public override toType(): TYPE.Function {
		return this.functionType;
	}
}
export {ValueFunction as Function};
