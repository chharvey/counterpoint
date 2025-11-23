import * as test from 'node:test';
import {Builder} from '../../src/index.ts';



test.suite('Builder', () => {
	test.suite('#setupModule', () => {
		test.test('validates successfully.', () => {
			new Builder().setupModule(); // assert does not throw
		});
	});
});
