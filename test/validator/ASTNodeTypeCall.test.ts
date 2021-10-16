import * as assert from 'assert';
import {
	// {ASTNodeKey, ...} as AST,
	Validator,
	SolidType,
	SolidTypeList,
	SolidTypeHash,
	SolidTypeSet,
	SolidTypeMap,
	SolidNull,
	SolidBoolean,
	Int16,
	TypeError05,
	TypeError06,
} from '../../src/index.js';
import * as AST from '../../src/validator/astnode/index.js'; // HACK



describe('ASTNodeTypeCall', () => {
	describe('#eval', () => {
		const validator: Validator = new Validator();
		it('evaluates List, Hash, Set, and Map.', () => {
			assert.deepStrictEqual(
				[
					`List.<null>`,
					`Hash.<bool>`,
					`Set.<str>`,
					`Map.<int, float>`,
				].map((src) => AST.ASTNodeTypeCall.fromSource(src).eval(validator)),
				[
					new SolidTypeList(SolidNull),
					new SolidTypeHash(SolidBoolean),
					new SolidTypeSet(SolidType.STR),
					new SolidTypeMap(Int16, SolidType.FLOAT),
				],
			);
		});
		it('Map has a default type parameter.', () => {
			assert.deepStrictEqual(
				AST.ASTNodeTypeCall.fromSource(`Map.<int>`).eval(validator),
				new SolidTypeMap(Int16, Int16),
			);
		});
		it('throws if base is not an ASTNodeTypeAlias.', () => {
			[
				`int.<str>`,
				`(List | Hash).<bool>`,
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeTypeCall.fromSource(src).eval(validator), TypeError05);
			});
		});
		it('throws if base is not one of the allowed strings.', () => {
			[
				`SET.<str>`,
				`Mapping.<bool>`,
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeTypeCall.fromSource(src).eval(validator), SyntaxError);
			});
		});
		it('throws when providing incorrect number of arguments.', () => {
			[
				`List.<null, null>`,
				`Hash.<bool, bool, bool>`,
				`Set.<str, str, str, str>`,
				`Map.<int, int, int, int, int>`,
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeTypeCall.fromSource(src).eval(validator), TypeError06);
			});
		});
	});
});
