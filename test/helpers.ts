import Int16 from '../src/typer/Int16.class'
import Float64 from '../src/typer/Float64.class'
import {
	InstructionConst,
} from '../src/vm/Instruction.class'



export function instructionConstInt(x: bigint): InstructionConst {
	return new InstructionConst(new Int16(x))
}
export function instructionConstFloat(x: number): InstructionConst {
	return new InstructionConst(new Float64(x))
}
