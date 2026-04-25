import * as assert from 'node:assert';
import * as test from 'node:test';
import {
	InstructionTable,
	VmBuilder,
	Machine,
} from '../../src/vm/index.ts';



test.suite('Machine', () => {
	test.suite('#run', () => {
		test.test('basic operations.', () => {
			type Operand = number;
			const table = new InstructionTable<Operand>()
				.add({
					opcode: 0n,
					name:   'push',
					arity:  1n,
					action: (machine, args) => {
						machine.operandPush(machine.getData(args[0]));
					},
				})
				.add({
					opcode: 1n,
					name:   'add',
					arity:  0n,
					action: (machine, _args) => {
						const right: Operand = machine.operandPop();
						const left:  Operand = machine.operandPop();
						machine.operandPush(left + right);
					},
				});
			const machine = new Machine<Operand>(
				new VmBuilder<Operand>(table)
					.push('push', [2])
					.push('push', [3])
					.push('add')
					.toCode(),
				table,
			);
			machine.run();
			assert.strictEqual(machine.operandPop(), 5);
		});

		test.test('function calls.', () => {
			type Operand = number | string;
			const table = new InstructionTable<Operand>()
				.add({
					opcode: 0n,
					name:   'push',
					arity:  1n,
					action: (machine, args) => {
						machine.operandPush(machine.getData(args[0]));
					},
				})
				.add({
					opcode: 1n,
					name:   'add',
					arity:  0n,
					action: (machine, _args) => {
						const right: Operand = machine.operandPop();
						const left:  Operand = machine.operandPop();
						machine.operandPush((+left) + (+right));
					},
				})
				.add({
					opcode: 2n,
					name:   'call',
					arity:  1n,
					action: (machine, args) => {
						machine.call(machine.getData(args[0]).toString());
					},
				})
				.add({
					opcode: 3n,
					name:   'return',
					arity:  0n,
					action: (machine, _args) => {
						machine.return();
					},
				});
			const machine = new Machine<Operand>(
				new VmBuilder<Operand>(table)
					.push('push', [2])
					.push('push', [3])
					.push('call', ['add_fun'])
					.push('return')
					.label('add_fun')
					.push('add')
					.push('return')
					.toCode(),
				table,
			);
			machine.run();
			assert.strictEqual(machine.operandPop(), 5);
		});
	});
});
