import * as assert from 'assert';
import {Stack} from '../../src/index.js';



describe('Stack', () => {
	let stack: Stack<number>;


	beforeEach(() => {
		stack = new Stack<number>();
	});


	describe('.constructor', () => {
		it('constructs a new empty stack.', () => {
			assert.ok(stack.isEmpty);
		});
	});


	describe('#peek', () => {
		it('looks at the end of the stack.', () => {
			stack.push(42).push(420);
			assert.strictEqual(stack.peek(), 420);
			assert.strictEqual(stack.peek(), 420);
			assert.strictEqual(stack.peek(), 420);
			assert.ok(!stack.isEmpty);
		});

		it('throws when the stack is empty.', () => {
			assert.throws(() => stack.peek(), /Cannot peek empty stack./);
		});
	});


	describe('#push', () => {
		it('pushes to the stack.', () => {
			stack.push(42);
			assert.ok(!stack.isEmpty);
		});
	});


	describe('#pop', () => {
		it('pops from the stack.', () => {
			stack.push(42);
			assert.strictEqual(stack.pop()[1], 42);
			assert.ok(stack.isEmpty);
		});

		it('pops in reverse order of push.', () => {
			stack.push(42).push(420);
			const pop1: number = stack.pop()[1];
			const pop2: number = stack.pop()[1];
			assert.deepStrictEqual([pop1, pop2], [420, 42]);
			assert.ok(stack.isEmpty);
		});

		it('throws when the stack is empty.', () => {
			assert.throws(() => stack.pop(), /Cannot pop empty stack./);
		});
	});
});
