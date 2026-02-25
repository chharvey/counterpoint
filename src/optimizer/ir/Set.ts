import {AST} from '../../validator/index.ts';
import type {Local} from '../utils-public.ts';
import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';



/** Write a value to a variable/local. */
class IrSet extends Instruction {
	public constructor(
		private readonly target: AST.ASTNodeVariable | Local,
		private readonly value:  Value,
	) {
		super();
	}

	public override toString(): string {
		return `(SET ${ this.target instanceof AST.ASTNodeVariable ? this.target.source : this.target.name } ${ this.value })`;
	}
}
export {IrSet as Set};
