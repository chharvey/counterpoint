import {
	CPConfig,
	CONFIG_DEFAULT,
	TYPE,
	OBJ,
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


export function typeConstInt(x: bigint): TYPE.TypeUnit<OBJ.Integer> {
	return new OBJ.Integer(x).toType();
}
export function typeConstFloat(x: number): TYPE.TypeUnit<OBJ.Float> {
	return new OBJ.Float(x).toType();
}
export function typeConstStr(x: string): TYPE.TypeUnit<OBJ.String> {
	return new OBJ.String(x).toType();
}

export function instructionConstInt(x: bigint): INST.InstructionConst {
	return new INST.InstructionConst(new OBJ.Integer(x));
}
export function instructionConstFloat(x: number): INST.InstructionConst {
	return new INST.InstructionConst(new OBJ.Float(x));
}
