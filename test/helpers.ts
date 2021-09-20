import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	// {ASTNodeKey, ...} as AST,
	Validator,
	SolidTypeConstant,
	SolidObject,
	SolidNull,
	Int16,
	Float64,
	SolidString,
	INST,
	Builder,
} from '../src/index.js';
import * as AST from '../src/validator/astnode/index.js'; // HACK



export const CONFIG_FOLDING_OFF: SolidConfig = {
	...CONFIG_DEFAULT,
	compilerOptions: {
		...CONFIG_DEFAULT.compilerOptions,
		constantFolding: false,
	},
};



export function typeOperations(tests: ReadonlyMap<string, SolidObject>, config: SolidConfig = CONFIG_DEFAULT): void {
	return assert.deepStrictEqual(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src, config).type(new Validator(config))),
		[...tests.values()].map((expected) => new SolidTypeConstant(expected)),
	);
}
export function foldOperations(tests: Map<string, SolidObject>): void {
	return assert.deepStrictEqual(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src).fold(new Validator())),
		[...tests.values()],
	);
}
export function buildOperations(tests: ReadonlyMap<string, INST.InstructionExpression>): void {
	assert.deepStrictEqual(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src, CONFIG_FOLDING_OFF).build(new Builder(src, CONFIG_FOLDING_OFF))),
		[...tests.values()],
	);
}



export const TYPE_CONST_NULL: SolidTypeConstant = new SolidTypeConstant(SolidNull.NULL);
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
