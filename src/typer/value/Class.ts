import {TYPE} from '../index.ts';
import {noopMethod} from '../../lib/index.ts';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import {
	identical,
	Value,
} from './Value.ts';



/**
 * A Counterpoint class value.
 * A class is an object that constructs object instances.
 *
 * This implementation simply wraps a native class object.
 * @final
 */
class ValueClass extends Value {
	public constructor(
		public  readonly instanceType: TYPE.Type,
		private readonly nativeClass:  abstract new (...args: never[]) => Value = ValueClass,
		private readonly source:       string = '',
	) {
		super();
	}


	public override toString(): string {
		return this.source;
	}

	@strictEqual
	@identical
	@noopMethod(memoizeBinOp(true, true))
	@instanceOf(() => ValueClass)
	public override equal(value: Value): boolean {
		return this.nativeClass === (value as ValueClass).nativeClass;
	}

	public override toType(): TYPE.Class {
		return TYPE.CLASS;
	}
}
export {ValueClass as Class};
