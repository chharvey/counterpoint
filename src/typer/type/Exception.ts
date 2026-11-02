import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import {
	subtypeLaws,
	type Type,
} from './Type.ts';
import {
	isObjectType,
	ReferenceType,
} from './ReferenceType.ts';



/**
 * An `Exception` is used for runtime error reporting.
 * @final
 */
export class Exception extends ReferenceType {
	public override toString(): string {
		return 'Exception';
	}

	@instanceOf(() => VALUE.Exception)
	public override includes(_v: VALUE.Value): boolean {
		return true;
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
	@isObjectType
	@instanceOf(() => Exception)
	public override isSubtypeOf(_t: Type): boolean {
		return true;
	}

	public override mutableOf(): Type {
		return this;
	}
}
