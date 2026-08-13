import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
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
	/** @final */
	public override get isReference(): boolean {
		return false;
	}


	@memoizeMethod
	public override toType(): TYPE.Unit<this> {
		return new TYPE.Unit<this>(this);
	}

	/**
	 * Create an ExpressionRef that implements this object.
	 * @param cg the CodeGenerator
	 * @return   the binaryen expression
	 */
	public abstract codegen(cg: CodeGenerator): binaryen.ExpressionRef;
}
