import * as test from 'node:test';
import {VirtualMachine} from '../../src/index.ts';



test.suite('VirtualMachine', () => {
	test.suite('.constructor', () => {
		test.test('validates successfully.', () => {
			new VirtualMachine(); // assert does not throw
		});
	});
});
