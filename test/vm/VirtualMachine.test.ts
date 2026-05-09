import * as assert from 'node:assert';
import * as test from 'node:test';
import {VirtualMachine} from '../../src/index.ts';



test.suite('VirtualMachine', () => {
	test.suite('.constructor', () => {
		test.test('validates successfully.', () => {
			const vm = new VirtualMachine();
			assert.ok(vm.mod.validate());
		});
	});
});
