import {
	CPConfig,
	CONFIG_DEFAULT,
	TYPE,
	Int16,
	Float64,
	SolidString,
	INST,
} from '../src/index.js';



export const CONFIG_RADICES_SEPARATORS_ON: CPConfig = {
	...CONFIG_DEFAULT,
	languageFeatures: {
		...CONFIG_DEFAULT.languageFeatures,
		integerRadices:    true,
		numericSeparators: true,
	},
};

export const CONFIG_FOLDING_OFF: CPConfig = {
	...CONFIG_DEFAULT,
	compilerOptions: {
		...CONFIG_DEFAULT.compilerOptions,
		constantFolding: false,
	},
};

export const CONFIG_COERCION_OFF: CPConfig = {
	...CONFIG_DEFAULT,
	compilerOptions: {
		...CONFIG_DEFAULT.compilerOptions,
		intCoercion: false,
	},
};

export const CONFIG_FOLDING_COERCION_OFF: CPConfig = {
	...CONFIG_DEFAULT,
	compilerOptions: {
		...CONFIG_DEFAULT.compilerOptions,
		constantFolding: false,
		intCoercion:     false,
	},
};



export function typeConstInt(x: bigint): TYPE.TypeUnit {
	return new TYPE.TypeUnit(new Int16(x));
}
export function typeConstFloat(x: number): TYPE.TypeUnit {
	return new TYPE.TypeUnit(new Float64(x));
}
export function typeConstStr(x: string): TYPE.TypeUnit {
	return new TYPE.TypeUnit(new SolidString(x));
}

export function instructionConstInt(x: bigint): INST.InstructionConst {
	return new INST.InstructionConst(new Int16(x));
}
export function instructionConstFloat(x: number): INST.InstructionConst {
	return new INST.InstructionConst(new Float64(x));
}
