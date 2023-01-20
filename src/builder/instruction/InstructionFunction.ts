import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {Instruction} from './Instruction.js';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionDeclareLocal} from './InstructionDeclareLocal.js';



/**
 * Create a new function.
 */
export class InstructionFunction extends Instruction {
	/**
	 * @param id    a unique id number
	 * @param exprs the body of the function
	 */
	public constructor(
		private readonly id: bigint,
		private readonly locals: readonly {id: bigint, isFloat: boolean}[],
		private readonly exprs: readonly InstructionExpression[],
	) {
		super();
	}

	public override toString(): string {
		const locals: string[] = this.locals.map((var_, i) => new InstructionDeclareLocal(i, var_.isFloat).toString());
		return xjs.String.dedent`
			(func $fn${ this.id.toString(16) } ${ locals.join(' ') }
				${ this.exprs.join('\n') }
			)
		`;
	}

	public override buildBin(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.addFunction(
			`$fn${ this.id.toString(16) }`,
			binaryen.createType([]),
			binaryen.createType([]),
			this.locals.map((var_) => (!var_.isFloat) ? binaryen.i32 : binaryen.f64),
			this.exprs.map((expr) => expr.buildBin(mod)).at(-1) ?? mod.nop(),
		);
	}
}
