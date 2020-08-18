import {
	Int16,
	Float64,
} from '../src/typer/'
import {
	InstructionConst,
} from '../src/builder/'



export function instructionConstInt(x: bigint): InstructionConst {
	return new InstructionConst(new Int16(x))
}
export function instructionConstFloat(x: number): InstructionConst {
	return new InstructionConst(new Float64(x))
}
