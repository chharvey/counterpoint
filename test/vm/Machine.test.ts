import * as assert from 'assert';
import {
	InstructionTable,
	VMBuilder as Builder,
	Machine,
} from '../../src/index.js';



describe('Machine', () => {
	describe('#run', () => {
		it('runs!', () => {
			const table = new InstructionTable<number>()
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
						const right: number = machine.operandPop();
						const left:  number = machine.operandPop();
						machine.operandPush(left + right);
					},
				});
			const machine = new Machine<number>(
				new Builder<number>(table)
					.push('push', [2])
					.push('push', [3])
					.push('add')
					.toCode(),
				table,
			);
			machine.run();
			assert.strictEqual(machine.operandPop(), 5);
		});
	});
});
