import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	AST,
	TYPE,
	TypeErrorNotCallable,
	TypeErrorArgCount,
} from '../../src/index.ts';
import {
	extract_lines,
	assertEqualTypes,
} from '../utils.ts';



test.suite('TypeCall', () => {
	test.suite('#varCheck', () => {
		test.test('throws if base is not one of the allowed strings.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				SET.<str>
				Mapping.<bool>
			`, (src) => {
				assert.throws(() => AST.TYPE.Call.fromSource(src).varCheck(), SyntaxError);
			});
		});
	});


	test.suite('#eval', () => {
		test.test('evaluates List, Dict, Set, and Map.', () => {
			assertEqualTypes(
				[
					'List.<null>',
					'Dict.<bool>',
					'Set.<str>',
					'Map.<int, float>',
				].map((src) => AST.TYPE.Call.fromSource(src).eval()),
				[
					new TYPE.List(TYPE.NULL),
					new TYPE.Dict(TYPE.BOOL),
					new TYPE.Set(TYPE.STR),
					new TYPE.Map(TYPE.INT, TYPE.FLOAT),
				],
			);
		});
		test.test('Map has a default type parameter.', () => {
			assertEqualTypes(
				AST.TYPE.Call.fromSource('Map.<int>').eval(),
				new TYPE.Map(TYPE.INT, TYPE.INT),
			);
		});
		test.test('throws if base is not a TypeAlias.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				int.<str>
				(int | float).<bool>
			`, (src) => assert.throws(() => AST.TYPE.Call.fromSource(src).eval(), TypeErrorNotCallable));
		});
		test.test('throws when providing incorrect number of arguments.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				List.<null, null>
				Dict.<bool, bool, bool>
				Set.<str, str, str, str>
				Map.<int, int, int, int, int>
			`, (src) => assert.throws(() => AST.TYPE.Call.fromSource(src).eval(), TypeErrorArgCount));
		});
	});
});
