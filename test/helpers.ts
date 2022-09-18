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



export function typeUnitInt(x: bigint): TYPE.TypeUnit<OBJ.Integer> {
	return new TYPE.TypeUnit<OBJ.Integer>(new OBJ.Integer(x));
}
export function typeUnitFloat(x: number): TYPE.TypeUnit<OBJ.Float> {
	return new TYPE.TypeUnit<OBJ.Float>(new OBJ.Float(x));
}
export function typeUnitStr(x: string): TYPE.TypeUnit<OBJ.String> {
	return new TYPE.TypeUnit<OBJ.String>(new OBJ.String(x));
}

export function instructionConstInt(x: bigint): INST.InstructionConst {
	return new INST.InstructionConst(new OBJ.Integer(x));
}
export function instructionConstFloat(x: number): INST.InstructionConst {
	return new INST.InstructionConst(new OBJ.Float(x));
}
