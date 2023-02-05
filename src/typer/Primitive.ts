import type binaryen from 'binaryen';
import {
	INST,
	Builder,
} from './package.js';
import {
	SolidNumber,
	Float64,
} from './index.js';
import {SolidObject} from './SolidObject.js';



/**
 * Known subclasses:
 * - SolidNull
 * - SolidBoolean
 * - Int16
 * - Float64
 * - SolidString
 */
export abstract class Primitive extends SolidObject {
	protected abstract get builtValue(): SolidNumber;

	/** @final */
	public override build(): INST.InstructionConst {
		return new INST.InstructionConst(this.builtValue);
	}

	/** @final */
	public build_bin(builder: Builder): binaryen.ExpressionRef {
		if (this.builtValue.identical(new Float64(-0.0))) {
			return builder.module.f64.ceil(builder.module.f64.const(-0.5)); // -0.0
		}
		return builder.module[(this.builtValue instanceof Float64) ? 'f64' : 'i32'].const(Number(this.builtValue.toString()));
	}
}
