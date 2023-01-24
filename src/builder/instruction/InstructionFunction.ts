import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {Instruction} from './Instruction.js';
import type {InstructionExpression} from './InstructionExpression.js';
import {InstructionDeclareLocal} from './InstructionDeclareLocal.js';



/**
 * Create a new function.
 */
export class InstructionFunction extends Instruction {
	/** The readable function name. */
	private readonly name: string;

	/**
	 * @param id       a unique id number
	 * @param locals   the local variables in the function
	 * @param exprs    the body of the function
	 * @param exported Should this function be exported?
	 */
	public constructor(
		private readonly id:       bigint,
		private readonly locals:   readonly {id: bigint, isFloat: boolean}[],
		private readonly exprs:    readonly InstructionExpression[],
		private readonly exported: boolean = false,
	) {
		super();
		this.name = `fn${ this.id.toString(16) }`;
	}

	public override toString(): string {
		const locals: string[] = this.locals.map((var_, i) => new InstructionDeclareLocal(i, var_.isFloat).toString());
		return xjs.String.dedent`
			(func $${ this.name } ${ (this.exported) ? `(export "${ this.name }")` : '' } ${ locals.join(' ') }
				${ this.exprs.join('\n') }
			)
		`;
	}

	public override buildBin(mod: binaryen.Module): binaryen.FunctionRef {
		(this.exported) && mod.addFunctionExport(this.name, this.name);
		return mod.addFunction(
			this.name,
			binaryen.createType([]),
			binaryen.createType([]),
			this.locals.map((var_) => (!var_.isFloat) ? binaryen.i32 : binaryen.f64),
			mod.block(null, this.exprs.map((expr) => expr.buildBin(mod))),
		);
	}
}
