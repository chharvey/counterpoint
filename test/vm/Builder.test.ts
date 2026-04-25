import * as assert from 'node:assert';
import * as test from 'node:test';
import {
	type VMInstruction as Instruction,
	InstructionTable,
	VMBuilder as Builder,
} from '../../src/index.js';



test.suite('Builder', () => {
	// eslint-disable-next-line @typescript-eslint/init-declarations
	let builder: Builder<number>;

	const noop: Instruction<number>['action'] = (_machine, _args) => undefined;


	test.beforeEach(() => {
		builder = new Builder<number>(new InstructionTable<number>().add({
			opcode: 0n,
			name:   'noop',
			arity:  0n,
			action: noop,
		}).add({
			opcode: 1n,
			name:   'push',
			arity:  1n,
			action: noop,
		}).add({
			opcode: 2n,
			name:   'pop',
			arity:  0n,
			action: noop,
		}));
	});


	test.suite('.constructor', () => {
		test.test('constructs a new empty builder.', () => {
			assert.deepStrictEqual(builder.instructions, []);
		});
	});


	test.suite('#push', () => {
		test.test('pushes an instruction to the builder.', () => {
			builder.push('noop', []);
			assert.deepStrictEqual(builder.instructions, [
				0n, // opcode
				0n, // arity
			]);
		});

		test.test('pushses an instruction and arguments to the builder.', () => {
			builder.push('push', [123]);
			assert.deepStrictEqual(builder.instructions, [
				1n, // opcode
				1n, // arity
				0n, // arg index
			]);
		});

		test.test('should throw when pushing an incorrect arity.', () => {
			assert.throws(() => builder.push('pop', [1]));
		});
	});


	test.suite('#label', () => {
		test.test('sets a label to the current number of instructions.', () => {
			builder.push('noop', []);
			builder.label('wow');
			assert.strictEqual(builder.labels['wow'], 2n);
		});
	});


	test.suite('#data', () => {
		test.test('data is deduped.', () => {
			builder.push('push', [123]);
			builder.push('push', [123]);
			builder.push('push', [123]);
			assert.deepStrictEqual(builder.data, [123]);
		});
	});


	test.suite('#toCode', () => {
		test.test('builds a Code object.', () => {
			builder.push('noop', []);
			builder.push('push', [123]);
			builder.push('pop', []);
			assert.deepStrictEqual(builder.toCode(), {
				data: [123],
				code: [
					0n, // `noop` opcode
					0n, // `noop` arity
					1n, // `push` opcode
					1n, // `push` arity
					0n, // `push` arg index
					2n, // `pop` opcode
					0n, // `pop` arity
				],
				labels: new Map([
					[0n, 'main'],
				]),
				symbols: new Map([
					[0n, 'noop'],
					[1n, 'push'],
					[2n, 'pop'],
				]),
			});
		});
	});
});
