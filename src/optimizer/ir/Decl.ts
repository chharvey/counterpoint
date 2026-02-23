import {AST} from '../../validator/index.ts';
import type {Local} from '../utils-public.ts';
import {Instruction} from './Instruction.ts';



export class Decl extends Instruction {
	public constructor(private readonly target: AST.ASTNodeVariable | Local) {
		super();
	}

	public override toString(): string {
		return `(DECL ${ this.target instanceof AST.ASTNodeVariable ? this.target.source : this.target.name })`;
	}
}
