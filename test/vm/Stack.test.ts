import * as assert from 'node:assert';
import * as test from 'node:test';
import {Stack} from '../../src/index.js';



test.suite('Stack', () => {
	// eslint-disable-next-line @typescript-eslint/init-declarations
	let stack: Stack<number>;


	test.beforeEach(() => {
		stack = new Stack<number>();
	});


	test.suite('.constructor', () => {
		test.test('constructs a new empty stack.', () => {
			assert.ok(stack.isEmpty);
		});
	});


	test.suite('#peek', () => {
		test.test('looks at the end of the stack.', () => {
			stack.push(42).push(420);
			assert.strictEqual(stack.peek(), 420);
			assert.strictEqual(stack.peek(), 420);
			assert.strictEqual(stack.peek(), 420);
			assert.ok(!stack.isEmpty);
		});

		test.test('throws when the stack is empty.', () => {
			assert.throws(() => stack.peek(), /Cannot peek empty stack./);
		});
	});


	test.suite('#push', () => {
		test.test('pushes to the stack.', () => {
			stack.push(42);
			assert.ok(!stack.isEmpty);
		});
	});


	test.suite('#pop', () => {
		test.test('pops from the stack.', () => {
			stack.push(42);
			assert.strictEqual(stack.pop()[1], 42);
			assert.ok(stack.isEmpty);
		});

		test.test('pops in reverse order of push.', () => {
			stack.push(42).push(420);
			const pop1: number = stack.pop()[1];
			const pop2: number = stack.pop()[1];
			assert.deepStrictEqual([pop1, pop2], [420, 42]);
			assert.ok(stack.isEmpty);
		});

		test.test('throws when the stack is empty.', () => {
			assert.throws(() => stack.pop(), /Cannot pop empty stack./);
		});
	});
});
