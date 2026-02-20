import type {CFG} from '../../index.ts';
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
	/** @final */ public override lower(): CFG.CfgNode {
		throw new Error('`Primitive#lower` not yet supported.');
	}

	@memoizeMethod
	/** @final */ public override toType(): TYPE.Unit<this> {
		return new TYPE.Unit<this>(this);
	}
}
