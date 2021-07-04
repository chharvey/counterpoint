import {
	SolidTypeConstant,
	Int16,
	Float64,
	SolidString,
} from '../src/typer/index.js';
import {
	INST,
} from '../src/builder/index.js';



export function typeConstInt(x: bigint): SolidTypeConstant {
	return new SolidTypeConstant(new Int16(x))
}
export function typeConstFloat(x: number): SolidTypeConstant {
	return new SolidTypeConstant(new Float64(x))
}
export function typeConstStr(x: string): SolidTypeConstant {
	return new SolidTypeConstant(new SolidString(x));
}

export function instructionConstInt(x: bigint): INST.InstructionConst {
	return new INST.InstructionConst(new Int16(x));
}
export function instructionConstFloat(x: number): INST.InstructionConst {
	return new INST.InstructionConst(new Float64(x));
}
