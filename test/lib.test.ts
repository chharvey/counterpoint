import * as assert from 'assert';
import {
	Set_hasEq,
	Set_addEq,
	Set_deleteEq,
	Set_intersectionEq,
	Set_unionEq,
	Set_differenceEq,
	Set_symmetricDifferenceEq,
	Map_hasEq,
	Map_getEq,
	Map_setEq,
	Map_deleteEq,
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


	context('maps.', () => {
		context('map methods.', () => {
			let my_map: Map<Item, string>;
			beforeEach(() => {
				my_map = new Map([[{id: 42}, 'a']]);
			});
			specify('Map_hasEq', () => {
				assert.ok(Map_hasEq(my_map, {id: 42}, comparator));
			});
			specify('Map_getEq', () => {
				assert.strictEqual(Map_getEq(my_map, {id: 42}, comparator), 'a');
			});
			specify('Map_setEq', () => {
				Map_setEq(my_map, {id: 42}, 'b', comparator);
				assert.strictEqual(my_map.size, 1);
			});
			specify('Map_deleteEq', () => {
				Map_deleteEq(my_map, {id: 42}, comparator);
				assert.strictEqual(my_map.size, 0);
			});
		});
	});
});
