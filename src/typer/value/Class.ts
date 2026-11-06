import {TYPE} from '../index.ts';
import {Object as ValueObject} from './Object.ts';



/**
 * A Counterpoint class value.
 * A class is an object that constructs object instances.
 * @final
 */
class ValueClass extends ValueObject {
	public constructor(
		public  readonly instanceType: TYPE.Type,
		class_?:                       ValueClass,
		private readonly source?:      string,
	) {
		super(0n, class_);
	}


	public override toString(): string {
		return this.source ?? '';
	}

	public override toType(): TYPE.Class {
		return TYPE.CLASS;
	}
}
export {ValueClass as Class};
