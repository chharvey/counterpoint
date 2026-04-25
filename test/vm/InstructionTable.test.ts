import * as assert from 'node:assert';
import * as test from 'node:test';
import {
	type VMInstruction as Instruction,
	InstructionTable,
} from '../../src/index.js';



test.suite('InstructionTable', () => {
	// eslint-disable-next-line @typescript-eslint/init-declarations
	let table: InstructionTable<number>;

	const mock_instruction: Instruction<number> = {
		opcode: 0n,
		name:   'noop',
		arity:  0n,
		action: (_machine, _args) => undefined,
	};


	test.beforeEach(() => {
		table = new InstructionTable<number>();
	});


	test.suite('.constructor', () => {
		test.test('constructs a new empty table.', () => {
			assert.ok(table.isEmpty);
		});
	});


	test.suite('#add', () => {
		test.test('adds to the table.', () => {
			table.add(mock_instruction);
			assert.ok(!table.isEmpty);
		});
	});


	test.suite('#getByOpcode', () => {
		test.test('gets an instruction given its opcode.', () => {
			table.add(mock_instruction);
			assert.strictEqual(table.getByOpcode(0n), mock_instruction);
		});
	});


	test.suite('#getByName', () => {
		test.test('gets an instruction given its name.', () => {
			table.add(mock_instruction);
			assert.strictEqual(table.getByName('noop'), mock_instruction);
		});
	});


	test.suite('#getSymbols', () => {
		test.test('inspects the symbols in the table.', () => {
			table.add(mock_instruction);
			assert.deepStrictEqual(table.getSymbols(), new Map([
				[mock_instruction.opcode, mock_instruction.name],
			]));
		});
	});
});
