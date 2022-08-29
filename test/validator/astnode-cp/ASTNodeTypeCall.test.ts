import * as assert from 'assert';
import {
	AST,
	TYPE,
	TypeError05,
	TypeError06,
} from '../../../src/index.js';



describe('ASTNodeTypeCall', () => {
	/* eslint-disable quotes */
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
					new TYPE.TypeList(TYPE.Type.NULL),
					new TYPE.TypeDict(TYPE.Type.BOOL),
					new TYPE.TypeSet(TYPE.Type.STR),
					new TYPE.TypeMap(TYPE.Type.INT, TYPE.Type.FLOAT),
				],
			);
		});
		it('Map has a default type parameter.', () => {
			assert.deepStrictEqual(
				AST.ASTNodeTypeCall.fromSource(`Map.<int>`).eval(),
				new TYPE.TypeMap(TYPE.Type.INT, TYPE.Type.INT),
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
	/* eslint-enable quotes */
});
