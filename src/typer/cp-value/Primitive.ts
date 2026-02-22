import {IR} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {TYPE} from '../index.ts';
import {Value} from './Value.ts';



/**
 * Known subclasses:
 * - Null
 * - ValueBoolean
 * - ValueSymbol
 * - ValueNumber
 * - ValueString
 */
export abstract class Primitive extends Value {
	@memoizeMethod
	/** @final */ public override lower(): IR.Constant {
		return new IR.Constant(this);
	}

	@memoizeMethod
	/** @final */ public override toType(): TYPE.Unit<this> {
		return new TYPE.Unit<this>(this);
	}
}
