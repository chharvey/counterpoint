import * as assert from 'assert';
import {
	Set_addEq,
	Set_deleteEq,
	Set_differenceEq,
	Set_hasEq,
	Set_intersectionEq,
	Set_symmetricDifferenceEq,
	Set_unionEq,
} from '../src/lib/index.js';

context('library.', () => {
	type Item = {id: number};
	const comparator = (a: Item, b: Item) => a.id === b.id;


	context('sets.', () => {
		context('set methods.', () => {
			let my_set: Set<Item>;
			beforeEach(() => {
				my_set = new Set([{id: 42}]);
			});
			specify('Set_hasEq', () => {
				assert.ok(Set_hasEq(my_set, {id: 42}, comparator));
			});
			specify('Set_addEq', () => {
				Set_addEq(my_set, {id: 42}, comparator);
				assert.strictEqual(my_set.size, 1);
			});
			specify('Set_deleteEq', () => {
				Set_deleteEq(my_set, {id: 42}, comparator);
				assert.strictEqual(my_set.size, 0);
			});
		});

		context('set operations.', () => {
			const a: ReadonlySet<Item> = new Set([{id: 1}, {id: 2}, {id: 3}]);
			const b: ReadonlySet<Item> = new Set([{id: 2}, {id: 3}, {id: 4}]);
			specify('Set_intersectionEq', () => {
				assert.deepStrictEqual(
					Set_intersectionEq(a, b, comparator),
					new Set([{id: 2}, {id: 3}]),
				);
			});
			specify('Set_unionEq', () => {
				assert.deepStrictEqual(
					Set_unionEq(a, b, comparator),
					new Set([{id: 1}, {id: 2}, {id: 3}, {id: 4}]),
				);
			});
			specify('Set_differenceEq', () => {
				assert.deepStrictEqual(
					Set_differenceEq(a, b, comparator),
					new Set([{id: 1}]),
				);
				assert.deepStrictEqual(
					Set_differenceEq(b, a, comparator),
					new Set([{id: 4}]),
				);
			});
			specify('Set_symmetricDifferenceEq', () => {
				assert.deepStrictEqual(
					Set_symmetricDifferenceEq(a, b, comparator),
					new Set([{id: 1}, {id: 4}]),
				);
			});
		});
	});
});
