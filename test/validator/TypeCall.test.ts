import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	AST,
	TYPE,
	ReferenceErrorKind,
	TypeErrorNotCallable,
	TypeErrorArgCount,
} from '../../src/index.ts';
import {
	extract_lines,
	assertAssignable,
	assertEqualTypes,
} from '../utils.ts';



test.suite('TypeCall', () => {
	test.suite('#varCheck', () => {
		test.test('catches ReferenceErrorKind thrown by `TypeAlias#varCheck`.', () => {
			AST.TYPE.Call.fromSource('List.<int>').varCheck(); // assert does not throw
			return assert.throws(() => AST.TYPE.Type.fromSource('List | Dict').varCheck(), (err) => {
				assertAssignable(err as Error, {
					cons:   AggregateError,
					errors: [
						{cons: ReferenceErrorKind, message: '`List` refers to a type function, but is used as a type.'},
						{cons: ReferenceErrorKind, message: '`Dict` refers to a type function, but is used as a type.'},
					],
				});
				return true;
			});
		});
	});


	test.suite('#eval', () => {
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
				].map((src) => AST.TYPE.Call.fromSource(src).eval()),
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
			`, (src) => assert.throws(() => AST.TYPE.Call.fromSource(src).eval(), TypeErrorNotCallable));
		});
		test.test('throws when providing incorrect number of arguments.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				List.<null, null>
				Dict.<bool, bool, bool>
				Set.<str, str, str, str>
				Map.<int, int, int, int, int>
				None.<int, int>
				Some.<int, int>
			`, (src) => assert.throws(() => AST.TYPE.Call.fromSource(src).eval(), TypeErrorArgCount));
		});
		test.test('None and Some are disjoint.', () => {
			assert.ok(AST.TYPE.Call.fromSource('None.<int>').eval().isDisjointWith(AST.TYPE.Call.fromSource('Some.<int>').eval()));
		});
	});
});
