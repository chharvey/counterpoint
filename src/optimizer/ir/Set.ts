import type {AST} from '../../validator/index.ts';
import {Instruction} from './Instruction.ts';



class IrSet extends Instruction {
	public constructor(
		private readonly target: AST.ASTNodeVariable | string,
		private readonly value:  Instruction,
	) {
		super();
	}

	public override toString(): string {
		return `(SET ${ typeof this.target === 'string' ? this.target : this.target.source } ${ this.value })`;
	}
}
export {IrSet as Set};
