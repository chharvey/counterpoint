import {
	SolidConfig,
	CONFIG_DEFAULT,
	SolidTypeUnit,
	Int16,
	Float64,
	SolidString,
	INST,
} from '../src/index.js';



export const CONFIG_FOLDING_OFF: SolidConfig = {
	...CONFIG_DEFAULT,
	compilerOptions: {
		...CONFIG_DEFAULT.compilerOptions,
		constantFolding: false,
	},
};



export function typeConstInt(x: bigint): SolidTypeUnit<Int16> {
	return new SolidTypeUnit<Int16>(new Int16(x));
}
export function typeConstFloat(x: number): SolidTypeUnit<Float64> {
	return new SolidTypeUnit<Float64>(new Float64(x));
}
export function typeConstStr(x: string): SolidTypeUnit<SolidString> {
	return new SolidTypeUnit<SolidString>(new SolidString(x));
}

export function instructionConstInt(x: bigint): INST.InstructionConst {
	return new INST.InstructionConst(new Int16(x));
}
export function instructionConstFloat(x: number): INST.InstructionConst {
	return new INST.InstructionConst(new Float64(x));
}
export function instructionConvert(x: bigint): INST.InstructionConvert {
	return new INST.InstructionConvert(instructionConstInt(x));
}
