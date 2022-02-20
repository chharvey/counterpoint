import * as assert from 'assert';
import {
	VMInstruction as Instruction,
	InstructionTable,
} from '../../src/index.js';



describe('InstructionTable', () => {
	const mock_instruction: Instruction = {
		opcode: 0n,
		name:   'noop',
		arity:  0n,
		action: (_machine, _args) => {},
	};


	describe('.constructor', () => {
		it('constructs a new empty table.', () => {
			const table = new InstructionTable();
			assert.ok(table.isEmpty);
		});
	});


	describe('#add', () => {
		it('adds to the table.', () => {
			const table = new InstructionTable();
			table.add(mock_instruction);
			assert.ok(!table.isEmpty);
		});
	});


	describe('#getByOpcode', () => {
		it('gets an instruction given its opcode.', () => {
			const table = new InstructionTable();
			table.add(mock_instruction);
			assert.strictEqual(table.getByOpcode(0n), mock_instruction);
		});
	});


	describe('#getByName', () => {
		it('gets an instruction given its opcode.', () => {
			const table = new InstructionTable();
			table.add(mock_instruction);
			assert.strictEqual(table.getByName('noop'), mock_instruction);
		});
	});
});
