import * as assert from 'assert';
import {
	VMInstruction as Instruction,
	InstructionTable,
	VMBuilder as Builder,
} from '../../src/index.js';



describe('Builder', () => {
	const noop: Instruction<number>['action'] = (_machine, _args) => {};


	function newMockInstructionTable(): InstructionTable<number> {
		return new InstructionTable<number>().add({
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
		});
	}


	describe('.constructor', () => {
		it('constructs a new empty builder.', () => {
			const builder = new Builder<number>(newMockInstructionTable());
			assert.deepStrictEqual(builder.instructions, []);
		});
	});


	describe('#push', () => {
		it('pushes an instruction to the builder.', () => {
			const builder = new Builder<number>(newMockInstructionTable());
			builder.push('noop', []);
			assert.deepStrictEqual(builder.instructions, [
				0n, // opcode
				0n, // arity
			]);
		});

		it('pushses an instruction and arguments to the builder.', () => {
			const builder = new Builder<number>(newMockInstructionTable());
			builder.push('push', [123]);
			assert.deepStrictEqual(builder.instructions, [
				1n, // opcode
				1n, // arity
				0n, // arg index
			]);
		});

		it('should throw when pushing an incorrect arity.', () => {
			const builder = new Builder<number>(newMockInstructionTable());
			assert.throws(() => builder.push('pop', [1]));
		});
	});


	describe('#label', () => {
		it('sets a label to the current number of instructions.', () => {
			const builder = new Builder<number>(newMockInstructionTable());
			builder.push('noop', []);
			builder.label('wow');
			assert.strictEqual(builder.labels['wow'], 2n);
		});
	});


	describe('#data', () => {
		it('data is deduped.', () => {
			const builder = new Builder<number>(newMockInstructionTable());
			builder.push('push', [123]);
			builder.push('push', [123]);
			builder.push('push', [123]);
			assert.deepStrictEqual(builder.data, [123]);
		});
	});


	describe('#toCode', () => {
		it('builds a Code object.', () => {
			const builder = new Builder<number>(newMockInstructionTable());
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
