import {
	SolidConfig,
	CONFIG_DEFAULT,
	SolidTypeUnit,
	SolidNull,
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



export const TYPE_CONST_NULL: SolidTypeUnit = new SolidTypeUnit(SolidNull.NULL);
export function typeConstInt(x: bigint): SolidTypeUnit {
	return new SolidTypeUnit(new Int16(x));
}
export function typeConstFloat(x: number): SolidTypeUnit {
	return new SolidTypeUnit(new Float64(x));
}
export function typeConstStr(x: string): SolidTypeUnit {
	return new SolidTypeUnit(new SolidString(x));
}

export function instructionConstInt(x: bigint): INST.InstructionConst {
	return new INST.InstructionConst(new Int16(x));
}
export function instructionConstFloat(x: number): INST.InstructionConst {
	return new INST.InstructionConst(new Float64(x));
}
