import type binaryen from 'binaryen';
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
