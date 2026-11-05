import {TYPE} from '../index.ts';
import {Value} from './Value.ts';



/**
 * A Counterpoint class value.
 * A class is an object that constructs object instances.
 * @final
 */
class ValueClass extends Value {
	public constructor(
		public  readonly instanceType: TYPE.Type,
		private readonly source:       string,
	) {
		super();
	}


	public override toString(): string {
		return this.source;
	}

	public override toType(): TYPE.Class {
		return TYPE.CLASS;
	}
}
export {ValueClass as Class};
