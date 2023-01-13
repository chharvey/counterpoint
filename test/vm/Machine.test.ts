import * as assert from 'assert';
import {
	InstructionTable,
	VMBuilder as Builder,
	Machine,
} from '../../src/index.js';



describe('Machine', () => {
	describe('#run', () => {
		it('basic operations.', () => {
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
				new Builder<Operand>(table)
					.push('push', [2])
					.push('push', [3])
					.push('add')
					.toCode(),
				table,
			);
			machine.run();
			assert.strictEqual(machine.operandPop(), 5);
		});

		it('function calls.', () => {
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
				new Builder<Operand>(table)
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
