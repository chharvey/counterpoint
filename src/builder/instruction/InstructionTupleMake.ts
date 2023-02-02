import binaryen from 'binaryen';
import {InstructionExpression} from './InstructionExpression.js';



export class InstructionTupleMake extends InstructionExpression {
	public override readonly binType: binaryen.Type = binaryen.createType(this.exprs.map((expr) => expr.binType));

	public constructor(
		private readonly exprs: readonly InstructionExpression[],
	) {
		super();
	}

	public override toString() {
		return `(tuple.make ${ this.exprs.join(' ') })`;
	}

	public override buildBin(mod: binaryen.Module) {
		return mod.tuple.make(this.exprs.map((expr) => expr.buildBin(mod)));
	}
}
