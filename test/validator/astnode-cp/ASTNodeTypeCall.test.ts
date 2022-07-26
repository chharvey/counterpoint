import * as assert from 'assert';
import {
	AST,
	TYPE,
	TypeError05,
	TypeError06,
} from '../../../src/index.js';



describe('ASTNodeTypeCall', () => {
	describe('#eval', () => {
		it('evaluates List, Dict, Set, and Map.', () => {
			assert.deepStrictEqual(
				[
					`List.<null>`,
					`Dict.<bool>`,
					`Set.<str>`,
					`Map.<int, float>`,
				].map((src) => AST.ASTNodeTypeCall.fromSource(src).eval()),
				[
					new TYPE.SolidTypeList(TYPE.SolidType.NULL),
					new TYPE.SolidTypeDict(TYPE.SolidType.BOOL),
					new TYPE.SolidTypeSet(TYPE.SolidType.STR),
					new TYPE.SolidTypeMap(TYPE.SolidType.INT, TYPE.SolidType.FLOAT),
				],
			);
		});
		it('Map has a default type parameter.', () => {
			assert.deepStrictEqual(
				AST.ASTNodeTypeCall.fromSource(`Map.<int>`).eval(),
				new TYPE.SolidTypeMap(TYPE.SolidType.INT, TYPE.SolidType.INT),
			);
		});
		it('throws if base is not an ASTNodeTypeAlias.', () => {
			[
				`int.<str>`,
				`(List | Dict).<bool>`,
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeTypeCall.fromSource(src).eval(), TypeError05);
			});
		});
		it('throws if base is not one of the allowed strings.', () => {
			[
				`SET.<str>`,
				`Mapping.<bool>`,
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeTypeCall.fromSource(src).eval(), SyntaxError);
			});
		});
		it('throws when providing incorrect number of arguments.', () => {
			[
				`List.<null, null>`,
				`Dict.<bool, bool, bool>`,
				`Set.<str, str, str, str>`,
				`Map.<int, int, int, int, int>`,
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeTypeCall.fromSource(src).eval(), TypeError06);
			});
		});
	});
});
