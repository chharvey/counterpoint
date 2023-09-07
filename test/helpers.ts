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

export const CONFIG_COERCION_OFF: SolidConfig = {
	...CONFIG_DEFAULT,
	compilerOptions: {
		...CONFIG_DEFAULT.compilerOptions,
		intCoercion: false,
	},
};



export function typeConstInt(x: bigint): SolidTypeUnit<Int16> {
	return new Int16(x).toType();
}
export function typeConstFloat(x: number): SolidTypeUnit<Float64> {
	return new Float64(x).toType();
}
export function typeConstStr(x: string): SolidTypeUnit<SolidString> {
	return new SolidString(x).toType();
}

export function instructionConstInt(x: bigint): INST.InstructionConst {
	return new INST.InstructionConst(new Int16(x));
}
export function instructionConstFloat(x: number): INST.InstructionConst {
	return new INST.InstructionConst(new Float64(x));
}
