import {SymbolSchemaVar} from '../../validator/index.ts';
import type {TYPE} from '../../typer/index.ts';
import type {Temp} from '../Builder.ts';
import {OpCode} from './Opcode.ts';
import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';



/** Write a value to a variable/local. */
class OpSet extends Instruction {
	public readonly targetName: string;
	public readonly targetType: TYPE.Type;


	public constructor(
		public readonly target: SymbolSchemaVar | Temp,
		public readonly value:  Value,
	) {
		super(OpCode.SET);
		if (this.target instanceof SymbolSchemaVar) {
			this.targetName = this.target.source;
			this.targetType = this.target.irType;
		} else {
			this.targetName = this.target.name;
			this.targetType = this.target.type;
		}
	}

	public override toString(): string {
		return super.toString(this.targetName, this.value);
	}
}
export {OpSet as Set};
