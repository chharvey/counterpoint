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
	test.suite('#eval', () => {
		const VISITOR = new AST.TypeVisitorTypevalue();

		test.test('evaluates Callable Interface Names.', () => {
			assertEqualTypes(
				[
					'List.<null>',
					'Dict.<bool>',
					'Set.<str>',
					'Map.<int, float>',
					'Maybe.<int>',
					'None.<int>',
					'Some.<int>',
					'Result.<int>',
					'Fail.<int>',
					'Ok.<int>',
					'Result.<int, Exception>',
					'Fail.<int, Exception>',
					'Ok.<int, Exception>',
				].map((src) => VISITOR.visit(AST.TYPE.Call.fromSource(src))),
				[
					new TYPE.List(TYPE.NULL),
					new TYPE.Dict(TYPE.BOOL),
					new TYPE.Set(TYPE.STR),
					new TYPE.Map(TYPE.INT, TYPE.FLOAT),
					new TYPE.Maybe(TYPE.INT),
					new TYPE.None(TYPE.INT),
					new TYPE.Some(TYPE.INT),
					new TYPE.Result(TYPE.INT),
					new TYPE.Fail(TYPE.INT),
					new TYPE.Ok(TYPE.INT),
					new TYPE.Result(TYPE.INT),
					new TYPE.Fail(TYPE.INT),
					new TYPE.Ok(TYPE.INT),
				],
			);
		});
		test.test('throws if base is not a TypeAlias.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				int.<str>
				(int | float).<bool>
			`, (src) => assert.throws(() => VISITOR.visit(AST.TYPE.Call.fromSource(src)), TypeErrorNotCallable));
		});
		test.test('throws when providing incorrect number of arguments.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				List.<null, null>
				Dict.<bool, bool, bool>
				Set.<str, str, str, str>
				Map.<int, int, int, int, int>
				None.<int, int>
				Some.<int, int>
			`, (src) => assert.throws(() => VISITOR.visit(AST.TYPE.Call.fromSource(src)), TypeErrorArgCount));
		});
		test.test('None and Some are disjoint.', () => {
			assert.ok(VISITOR.visit(AST.TYPE.Call.fromSource('None.<int>')).isDisjointWith(VISITOR.visit(AST.TYPE.Call.fromSource('Some.<int>'))));
		});
	});
});
