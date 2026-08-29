import type {TYPE} from '../index.ts';
import {Value} from './Value.ts';



/**
 * A Counterpoint function value.
 */
class ValueFunction extends Value {
	public constructor(
		private readonly type:   TYPE.Function,
		private readonly source: string,
	) {
		super();
	}


	public override readonly isReference = true;


	public override toString(): string {
		return this.source;
	}

	public override toType(): TYPE.Function {
		return this.type;
	}
}
export {ValueFunction as Function};
