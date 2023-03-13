import {
	SolidConfig,
	CONFIG_DEFAULT,
	SolidTypeUnit,
	Int16,
	Float64,
	SolidString,
	INST,
} from '../src/index.js';



export const CONFIG_RADICES_SEPARATORS_ON: SolidConfig = {
	...CONFIG_DEFAULT,
	languageFeatures: {
		...CONFIG_DEFAULT.languageFeatures,
		integerRadices:    true,
		numericSeparators: true,
	},
};

export const CONFIG_FOLDING_OFF: SolidConfig = {
	...CONFIG_DEFAULT,
	compilerOptions: {
		...CONFIG_DEFAULT.compilerOptions,
		constantFolding: false,
	},
};



export function typeUnitInt(x: bigint): SolidTypeUnit<Int16> {
	return new Int16(x).toType();
}
export function typeUnitFloat(x: number): SolidTypeUnit<Float64> {
	return new Float64(x).toType();
}
export function typeUnitStr(x: string): SolidTypeUnit<SolidString> {
	return new SolidString(x).toType();
}

export function instructionConstInt(x: bigint): INST.InstructionConst {
	return new INST.InstructionConst(new Int16(x));
}
export function instructionConstFloat(x: number): INST.InstructionConst {
	return new INST.InstructionConst(new Float64(x));
}
