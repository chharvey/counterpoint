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
	public readonly value:      Value;


	public constructor(target: SymbolSchemaVar, typ: TYPE.Type, value: Value);
	public constructor(target: Temp, value: Value);
	public constructor(
		public readonly target: SymbolSchemaVar | Temp,
		arg1:  TYPE.Type | Value,
		arg2?: Value,
	) {
		super(OpCode.SET);
		if (this.target instanceof SymbolSchemaVar) {
			this.targetName = this.target.source;
			this.targetType = arg1 as TYPE.Type;
			this.value = arg2!;
		} else {
			this.targetName = this.target.name;
			this.targetType = this.target.type;
			this.value = arg1 as Value;
		}
	}

	public override toString(): string {
		return super.toString(this.targetName, this.value);
	}
}
export {OpSet as Set};
