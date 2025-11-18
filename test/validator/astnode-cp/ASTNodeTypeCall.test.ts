import * as assert from 'node:assert';
import {
	AST,
	TYPE,
	TypeErrorNotCallable,
	TypeErrorArgCount,
} from '../../../src/index.ts';
import {assertEqualTypes} from '../../assert-helpers.ts';



describe('ASTNodeTypeCall', () => {
	describe('#varCheck', () => {
		it('throws if base is not one of the allowed strings.', () => {
			[
				'SET.<str>',
				'Mapping.<bool>',
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeTypeCall.fromSource(src).varCheck(), SyntaxError);
			});
		});
	});


	describe('#eval', () => {
		it('evaluates List, Dict, Set, and Map.', () => {
			assertEqualTypes(
				[
					'List.<null>',
					'Dict.<bool>',
					'Set.<str>',
					'Map.<int, float>',
				].map((src) => AST.ASTNodeTypeCall.fromSource(src).eval()),
				[
					new TYPE.List(TYPE.NULL),
					new TYPE.Dict(TYPE.BOOL),
					new TYPE.Set(TYPE.STR),
					new TYPE.Map(TYPE.INT, TYPE.FLOAT),
				],
			);
		});
		it('Map has a default type parameter.', () => {
			assertEqualTypes(
				AST.ASTNodeTypeCall.fromSource('Map.<int>').eval(),
				new TYPE.Map(TYPE.INT, TYPE.INT),
			);
		});
		it('throws if base is not an ASTNodeTypeAlias.', () => {
			[
				'int.<str>',
				'(int | float).<bool>',
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeTypeCall.fromSource(src).eval(), TypeErrorNotCallable);
			});
		});
		it('throws when providing incorrect number of arguments.', () => {
			[
				'List.<null, null>',
				'Dict.<bool, bool, bool>',
				'Set.<str, str, str, str>',
				'Map.<int, int, int, int, int>',
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeTypeCall.fromSource(src).eval(), TypeErrorArgCount);
			});
		});
	});
});
