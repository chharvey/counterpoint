import * as assert from 'node:assert';
import * as test from 'node:test';
import {
	assert_instanceof,
	type EntryType,
	VALUE,
	TYPE,
} from '../../src/index.ts';
import {
	repeat,
	assert_shallowStrictEqual,
	typeUnit,
} from '../utils.ts';



test.suite('Type', () => {
	/* eslint-disable no-useless-escape --- escapes are copied from markdown file; easier for search-and-replace */
	function predicate2<T>(array: readonly T[], p: (a: T, b: T) => void): void {
		array.forEach((a) => {
			array.forEach((b) => {
				p(a, b);
			});
		});
	}
	function predicate3<T>(array: readonly T[], p: (a: T, b: T, c: T) => void): void {
		array.forEach((a) => {
			array.forEach((b) => {
				array.forEach((c) => {
					p(a, b, c);
				});
			});
		});
	}
	const builtin_types: readonly TYPE.Type[] = [
		TYPE.NOTHING,
		TYPE.ANYTHING,
		TYPE.NULL,
		TYPE.BOOL,
		TYPE.SYM,
		TYPE.INT,
		TYPE.NAT,
		TYPE.FLOAT,
		TYPE.STR,
		TYPE.OBJ,
		TYPE.FALSE,
		TYPE.TRUE,
	];


	test.test('a type operation equaling to a built-in type returns that type by reference.', () => {
		assert.strictEqual(TYPE.BOOL.intersect(TYPE.STR),  TYPE.NOTHING);
		assert.strictEqual(TYPE.BOOL.union(TYPE.ANYTHING), TYPE.ANYTHING);
		assert.strictEqual(TYPE.FALSE.union(TYPE.TRUE),    TYPE.BOOL);
	});


	test.suite('#toString', () => {
		test.test('properly prioritizes operators.', () => {
			const a: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.FLOAT]);
			const b: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.INT]);
			const c: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.STR]);
			const tests = new Map<TYPE.Type, string>([
				[a.intersect(b).union(c), '(float,) & (int,) | (str,)'],
				[a.intersect(b.union(c)), '((int,) | (str,)) & (float,)'],
				[a.union(b).intersect(c), '((float,) | (int,)) & (str,)'],
				[a.union(b.intersect(c)), '(float,) | (int,) & (str,)'],
			]);
			return assert_shallowStrictEqual([...tests.keys()].map((k) => k.toString()), [...tests.values()]);
		});
		test.test('with boolean types.', () => {
			assert_shallowStrictEqual(
				[
					TYPE.BOOL,
					TYPE.NULL.union(TYPE.BOOL),
					TYPE.BOOL.union(TYPE.NULL),
					TYPE.Union.all(TYPE.NULL, TYPE.FALSE, TYPE.TRUE),
					TYPE.Union.all(TYPE.NULL, TYPE.TRUE, TYPE.FALSE),
					TYPE.Union.all(TYPE.FALSE, TYPE.TRUE, TYPE.NULL),
					TYPE.Union.all(TYPE.TRUE, TYPE.FALSE, TYPE.NULL),
					TYPE.Union.all(TYPE.FALSE, TYPE.NULL, TYPE.TRUE),
					TYPE.Union.all(TYPE.TRUE, TYPE.NULL, TYPE.FALSE),
				].map((t) => t.toString()),
				[
					'bool',
					...repeat('bool | null', 8),
				],
			);
		});
	});


	test.suite('#isDefinitelyFalsy', () => {
		test.test('only a combination of `nothing`, `null`, and `false` are definitely falsy.', () => {
			[
				TYPE.NOTHING,
				TYPE.Union.all(           TYPE.FALSE),
				TYPE.Union.all(TYPE.NULL            ),
				TYPE.Union.all(TYPE.NULL, TYPE.FALSE),
			].forEach((t) => assert.ok(t.isDefinitelyFalsy, `Expected \`${ t }\` to be definitely falsy.`));
		});
		test.test('any other types are not definitely falsy.', () => {
			[
				TYPE.ANYTHING,
				TYPE.TRUE,
				TYPE.BOOL,
				TYPE.SYM,
				TYPE.INT,
				TYPE.NAT,
				TYPE.FLOAT,
				TYPE.STR,
				TYPE.NULL.union(TYPE.FLOAT),
				TYPE.FALSE.union(TYPE.STR),
				TYPE.OBJ,
			].forEach((t) => assert.ok(!t.isDefinitelyFalsy, `Expected \`${ t }\` to not be definitely falsy.`));
		});
	});


	test.suite('#isDefinitelyTruthy', () => {
		test.test('all definitely falsy types are not definitely truthy.', () => {
			[
				TYPE.NOTHING,
				TYPE.Union.all(           TYPE.FALSE),
				TYPE.Union.all(TYPE.NULL            ),
				TYPE.Union.all(TYPE.NULL, TYPE.FALSE),
			].forEach((t) => assert.ok(!t.isDefinitelyTruthy, `Expected \`${ t }\` to not be definitely truthy.`));
		});
		test.test('unions of falsy types are not definitely truthy.', () => {
			[
				TYPE.ANYTHING,
				TYPE.BOOL,
				TYPE.NULL.union(TYPE.FLOAT),
				TYPE.FALSE.union(TYPE.STR),
			].forEach((t) => assert.ok(!t.isDefinitelyTruthy, `Expected \`${ t }\` to not be definitely truthy.`));
		});
		test.test('primitive value types (except `bool`) are definitely truthy.', () => {
			[
				TYPE.TRUE,
				TYPE.SYM,
				TYPE.INT,
				TYPE.NAT,
				TYPE.FLOAT,
				TYPE.STR,
			].forEach((t) => assert.ok(t.isDefinitelyTruthy, `Expected \`${ t }\` to be definitely truthy.`));
		});
		test.test('compound value types are definitely truthy.', () => {
			[
				TYPE.Tuple.fromTypes(),
				TYPE.Record.fromTypes(new Map([[0x100n, TYPE.INT]])),
			].forEach((t) => assert.ok(t.isDefinitelyTruthy, `Expected \`${ t }\` to be definitely truthy.`));
		});
		test.test('reference types are definitely truthy.', () => {
			[
				TYPE.OBJ,
				new TYPE.List(TYPE.INT),
				new TYPE.Dict(TYPE.INT),
				new TYPE.Set(TYPE.INT),
				new TYPE.Map(TYPE.INT, TYPE.INT),
			].forEach((t) => assert.ok(t.isDefinitelyTruthy, `Expected \`${ t }\` to be definitely truthy.`));
		});
	});


	test.test('#falsySide', () => {
		new Map<TYPE.Type, TYPE.Type>([
			[TYPE.NOTHING,  TYPE.NOTHING],
			[TYPE.ANYTHING, TYPE.NULL.union(TYPE.FALSE)],
			[TYPE.NULL,     TYPE.NULL],
			[TYPE.BOOL,     TYPE.FALSE],
			[TYPE.SYM,      TYPE.NOTHING],
			[TYPE.INT,      TYPE.NOTHING],
			[TYPE.NAT,      TYPE.NOTHING],
			[TYPE.FLOAT,    TYPE.NOTHING],
			[TYPE.STR,      TYPE.NOTHING],
			[TYPE.OBJ,      TYPE.NOTHING],
		]).forEach((right, left) => assert.ok(left.falsySide.equals(right), `${ left.falsySide } == ${ right }`));
	});


	test.test('#truthySide', () => {
		new Map<TYPE.Type, TYPE.Type>([
			[TYPE.NOTHING, TYPE.NOTHING],
			[TYPE.NULL,    TYPE.NOTHING],
			[TYPE.BOOL,    TYPE.TRUE],
			[TYPE.SYM,     TYPE.SYM],
			[TYPE.INT,     TYPE.INT],
			[TYPE.NAT,     TYPE.NAT],
			[TYPE.FLOAT,   TYPE.FLOAT],
			[TYPE.STR,     TYPE.STR],
			[TYPE.OBJ,     TYPE.OBJ],
		]).forEach((right, left) => assert.ok(left.truthySide.equals(right), `${ left.truthySide } == ${ right }`));
	});


	test.suite('#includes', () => {
		test.test('uses `Object#identical` to compare values.', () => {
			function unionOfInts(ns: readonly bigint[]): TYPE.Type {
				return TYPE.Union.all(...ns.map((v) => typeUnit(v)));
			}
			function unionOfFloats(ns: readonly number[]): TYPE.Type {
				return TYPE.Union.all(...ns.map((v) => typeUnit(v)));
			}
			const u1: TYPE.Type = unionOfFloats([4.2, 4.3, 4.4]);
			const u2: TYPE.Type = unionOfFloats([4.3, 4.4, 4.5]);
			const u3: TYPE.Type = unionOfInts([42n, 43n, 44n]);
			const u4: TYPE.Type = unionOfInts([43n, 44n, 45n]);
			assert.deepStrictEqual([
				u1,
				u2,
				u1.intersect(u2),
			].map((typ) => typ.values), [
				[4.2, 4.3, 4.4],
				[4.3, 4.4, 4.5],
				[4.3, 4.4],
			].map((ns) => new Set<VALUE.Float>(ns.map((n) => new VALUE.Float(n)))), '(4.2 | 4.3 | 4.4) & (4.3 | 4.4 | 4.5) == (4.3 | 4.4)');
			assert.deepStrictEqual([
				u3,
				u4,
				u3.union(u4),
			].map((typ) => typ.values), [
				[42n, 43n, 44n],
				[43n, 44n, 45n],
				[42n, 43n, 44n, 45n],
			].map((ns) => new Set<VALUE.Integer>(ns.map((n) => new VALUE.Integer(n)))), '(42 | 43 | 44) | (43 | 44 | 45) == (42 | 43 | 44 | 45)');
		});
	});


	test.suite('#intersect', () => {
		test.test('1-5 | `T  & nothing  == nothing`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.intersect(TYPE.NOTHING).isBottomType, `${ t }`);
			});
		});
		test.test('1-6 | `T  & anything == T`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.intersect(TYPE.ANYTHING).equals(t), `${ t }`);
			});
		});
		test.test('2-4 | `A  & B == B  & A`', () => {
			predicate2(builtin_types, (a, b) => {
				assert.ok(a.intersect(b).equals(b.intersect(a)), `${ a }, ${ b }`);
			});
		});
		test.test('2-6 | `(A  & B)  & C == A  & (B  & C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.intersect(b).intersect(c).equals(a.intersect(b.intersect(c))), `${ a }, ${ b }, ${ c }`);
			});
		});
		test.test('2-8 | `A  & (B \| C) == (A  & B) \| (A  & C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.intersect(b.union(c)).equals(a.intersect(b).union(a.intersect(c))), `${ a }, ${ b }, ${ c }`);
			});
		});
		test.test('3-9 | `C <: A --> (A  & B)  & C == B  & C`', () => {
			const a: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.BOOL, TYPE.INT]);
			const b: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.TRUE]);
			const c: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.FALSE, typeUnit(42n)]);
			const actual:   TYPE.Type = a.intersect(b).intersect(c);
			const expected: TYPE.Type = b.intersect(c);
			assert.ok(actual.equals(expected), '((bool, int) & (true,)) & (false, 42) == (true,) & (false, 42)');
			assert.deepStrictEqual(actual, expected);
		});
		test.suite('Intersection', () => {
			test.test('optimizes nested intersections: `(A & B) & A === A & B`', () => {
				const a: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.BOOL, TYPE.INT]);
				const b: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.TRUE]);
				const expected: TYPE.Type = a.intersect(b);
				assert.strictEqual(expected.intersect(a), expected);
			});
			test.test('switches operands when calling same operator.', () => {
				const a: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.BOOL]);
				const b: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.INT]);
				const c: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.STR]);
				assert.deepStrictEqual(
					[a.intersect(b).intersect(c),              a.intersect(b.intersect(c))],
					[new TYPE.Intersection(a.intersect(b), c), new TYPE.Intersection(b.intersect(c), a)],
				);
				return assert.notDeepStrictEqual(a.intersect(b.intersect(c)), new TYPE.Intersection(a.intersect(b), c));
			});
			test.test('doesn’t stack overflow.', () => {
				const a_int:   TYPE.Record = TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.INT]]));   // [a: int]
				const a_float: TYPE.Record = TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.FLOAT]])); // [a: float]
				const b_int:   TYPE.Record = TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([[0x101n, TYPE.INT]]));   // [b: int]
				const b_float: TYPE.Record = TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([[0x101n, TYPE.FLOAT]])); // [b: float]
				const left:  TYPE.Type = a_int  .intersect(b_float);
				const right: TYPE.Type = a_float.intersect(b_int);
				assert_instanceof(left,  TYPE.Intersection);
				assert_instanceof(right, TYPE.Intersection);
				left.intersect(right); // assert does not throw
			});
		});
	});


	test.suite('#union', () => {
		test.test('1-7 | `T \| nothing  == T`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.union(TYPE.NOTHING).equals(t), `${ t }`);
			});
		});
		test.test('1-8 | `T \| anything == anything`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.union(TYPE.ANYTHING).isTopType, `${ t }`);
			});
		});
		test.test('2-5 | `A \| B == B \| A`', () => {
			predicate2(builtin_types, (a, b) => {
				assert.ok(a.union(b).equals(b.union(a)), `${ a }, ${ b }`);
			});
		});
		test.test('2-7 | `(A \| B) \| C == A \| (B \| C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.union(b).union(c).equals(a.union(b.union(c))), `${ a }, ${ b }, ${ c }`);
			});
		});
		test.test('2-9 | `A \| (B  & C) == (A \| B)  & (A \| C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.union(b.intersect(c)).equals(a.union(b).intersect(a.union(c))), `${ a }, ${ b }, ${ c }`);
			});
		});
		test.test('3-a | `A <: C --> (A \| B) \| C == B \| C`', () => {
			const a: TYPE.Type = typeUnit(4.2);
			const b: TYPE.Type = typeUnit(42n);
			const c: TYPE.Type = TYPE.FLOAT;
			const actual:   TYPE.Type = a.union(b).union(c);
			const expected: TYPE.Type = b.union(c);
			assert.ok(actual.equals(expected), '(4.2 | 42) | float == 42 | float');
			assert.deepStrictEqual(actual, expected);
		});
		test.test('`false | true` (or swapped) returns `bool` by reference.', () => {
			assert.strictEqual(TYPE.FALSE.union(TYPE.TRUE), TYPE.BOOL);
			assert.strictEqual(TYPE.TRUE.union(TYPE.FALSE), TYPE.BOOL);
		});
		test.suite('Union', () => {
			test.test('optimizes nested unions: `(A | B) | A === A | B`', () => {
				const a: TYPE.Type = typeUnit(4.2);
				const b: TYPE.Type = typeUnit(42n);
				const expected: TYPE.Type = a.union(b);
				assert.strictEqual(expected.union(a), expected);
			});
			test.test('switches operands when calling same operator.', () => {
				const a: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.BOOL]);
				const b: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.INT]);
				const c: TYPE.Tuple = TYPE.Tuple.fromTypes([TYPE.STR]);
				assert.deepStrictEqual(
					[a.union(b).union(c),           a.union(b.union(c))],
					[new TYPE.Union(a.union(b), c), new TYPE.Union(b.union(c), a)],
				);
				return assert.notDeepStrictEqual(a.union(b.union(c)), new TYPE.Union(a.union(b), c));
			});
			test.test('doesn’t stack overflow.', () => {
				const a_int:   TYPE.Record = TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.INT]]));   // [a: int]
				const a_float: TYPE.Record = TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.FLOAT]])); // [a: float]
				const b_int:   TYPE.Record = TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([[0x101n, TYPE.INT]]));   // [b: int]
				const b_float: TYPE.Record = TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([[0x101n, TYPE.FLOAT]])); // [b: float]
				const left:  TYPE.Type = a_int  .union(b_float);
				const right: TYPE.Type = a_float.union(b_int);
				assert_instanceof(left,  TYPE.Union);
				assert_instanceof(right, TYPE.Union);
				left.union(right); // assert does not throw
			});
		});
	});


	test.suite('#subtract', () => {
		test.test('4-1 | `A - B == A  <->  A & B == nothing`', () => {
			predicate2(builtin_types, (a, b) => {
				if (a.intersect(b).isBottomType) {
					assert.ok(a.subtract(b).equals(a), `forward: ${ a }, ${ b }`);
				}
				if (a.subtract(b).equals(a)) {
					assert.ok(a.intersect(b).isBottomType, `backward: ${ a }, ${ b }`);
				}
			});
		});
		test.test('4-2 | `A - B == nothing  <->  A <: B`', () => {
			predicate2(builtin_types, (a, b) => {
				if (a.isSubtypeOf(b)) {
					assert.ok(a.subtract(b).isBottomType, `forward: ${ a }, ${ b }`);
				}
				if (a.subtract(b).isBottomType) {
					assert.ok(a.isSubtypeOf(b), `forward: ${ a }, ${ b }`);
				}
			});
		});
		test.test('4-3 | `A <: B - C  <->  A <: B  &&  A & C == nothing`', () => {
			predicate3(builtin_types, (a, b, c) => {
				if (a.isSubtypeOf(b.subtract(c))) {
					assert.ok(a.isSubtypeOf(b) && a.intersect(c).isBottomType, `forward: ${ a }, ${ b }, ${ c }`);
				}
				if (a.isSubtypeOf(b) && a.intersect(c).isBottomType) {
					assert.ok(a.isSubtypeOf(b.subtract(c)), `forward: ${ a }, ${ b }, ${ c }`);
				}
			});
		});
		test.test('4-4 | `(A \| B) - C == (A - C) \| (B - C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.union(b).subtract(c).equals(a.subtract(c).union(b.subtract(c))), `${ a }, ${ b }, ${ c }`);
			});
		});
		test.test('4-5 | `A - (B \| C) == (A - B)  & (A - C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.subtract(b.union(c)).equals(a.subtract(b).intersect(a.subtract(c))), `${ a }, ${ b }, ${ c }`);
			});
		});
	});


	test.suite('#isSubtypeOf', () => {
		test.test('1-1 | `nothing  <: T`', () => {
			builtin_types.forEach((t) => {
				assert.ok(TYPE.NOTHING.isSubtypeOf(t), `${ t }`);
			});
		});
		test.test('1-2 | `T        <: anything`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.isSubtypeOf(TYPE.ANYTHING), `${ t }`);
			});
		});
		test.test('1-3 | `T        <: nothing  <->  T == nothing`', () => {
			builtin_types.forEach((t) => {
				if (t.isSubtypeOf(TYPE.NOTHING)) {
					assert.ok(t.isBottomType, `${ t }`);
				}
			});
		});
		test.test('1-4 | `anything <: T        <->  T == anything`', () => {
			builtin_types.forEach((t) => {
				if (TYPE.ANYTHING.isSubtypeOf(t)) {
					assert.ok(t.isTopType, `${ t }`);
				}
			});
		});
		test.test('2-a | `A <: A`', () => {
			builtin_types.forEach((a) => {
				assert.ok(a.isSubtypeOf(a), `${ a }`);
			});
		});
		test.test('2-b | `A <: B  &&  B <: A  -->  A == B`', () => {
			predicate2(builtin_types, (a, b) => {
				if (a.isSubtypeOf(b) && b.isSubtypeOf(a)) {
					assert.ok(a.equals(b), `${ a }, ${ b }`);
				}
			});
		});
		test.test('2-c | `A <: B  &&  B <: C  -->  A <: C`', () => {
			predicate3(builtin_types, (a, b, c) => {
				if (a.isSubtypeOf(b) && b.isSubtypeOf(c)) {
					assert.ok(a.isSubtypeOf(c), `${ a }, ${ b }, ${ c }`);
				}
			});
		});
		test.test('3-1 | `A  & B <: A  &&  A  & B <: B`', () => {
			predicate2(builtin_types, (a, b) => {
				assert.ok(a.intersect(b).isSubtypeOf(a), `${ a }, ${ b }`);
				assert.ok(a.intersect(b).isSubtypeOf(b), `${ a }, ${ b }`);
			});
		});
		test.test('3-2 | `A <: A \| B  &&  B <: A \| B`', () => {
			predicate2(builtin_types, (a, b) => {
				assert.ok(a.isSubtypeOf(a.union(b)), `${ a }, ${ b }`);
				assert.ok(b.isSubtypeOf(a.union(b)), `${ a }, ${ b }`);
			});
		});
		test.test('3-3 | `A <: B  <->  A  & B == A`', () => {
			predicate2(builtin_types, (a, b) => {
				if (a.isSubtypeOf(b)) {
					assert.ok(a.intersect(b).equals(a), `forward: ${ a }, ${ b }`);
				}
				if (a.intersect(b).equals(a)) {
					assert.ok(a.isSubtypeOf(b), `backward: ${ a }, ${ b }`);
				}
			});
		});
		test.test('3-4 | `A <: B  <->  A \| B == B`', () => {
			predicate2(builtin_types, (a, b) => {
				if (a.isSubtypeOf(b)) {
					assert.ok(a.union(b).equals(b), `forward: ${ a }, ${ b }`);
				}
				if (a.union(b).equals(b)) {
					assert.ok(a.isSubtypeOf(b), `backward: ${ a }, ${ b }`);
				}
			});
		});
		test.test('3-5 | `A <: C    &&  A <: D  <->  A <: C  & D`', () => {
			predicate3(builtin_types, (a, c, d) => {
				if (a.isSubtypeOf(c) && a.isSubtypeOf(d)) {
					assert.ok(a.isSubtypeOf(c.intersect(d)), `forward: ${ a }, ${ c }, ${ d }`);
				}
				if (a.isSubtypeOf(c.intersect(d))) {
					assert.ok(a.isSubtypeOf(c) && a.isSubtypeOf(d), `backward: ${ a }, ${ c }, ${ d }`);
				}
			});
		});
		test.test('3-6 | `A <: C  \|\|  A <: D  -->  A <: C \| D`', () => {
			predicate3(builtin_types, (a, c, d) => {
				if (a.isSubtypeOf(c) || a.isSubtypeOf(d)) {
					assert.ok(a.isSubtypeOf(c.union(d)), `${ a }, ${ c }, ${ d }`);
				}
			});
			assert.ok(
				TYPE.NULL.union(TYPE.INT).isSubtypeOf(TYPE.NULL.union(TYPE.INT)) &&
				!TYPE.NULL.union(TYPE.INT).isSubtypeOf(TYPE.NULL) &&
				!TYPE.NULL.union(TYPE.INT).isSubtypeOf(TYPE.INT),
				'exists A, C, D s.t. `A <: C | D` but `!(A <: C)` and `!(A <: D)`',
			);
			return assert.ok(
				TYPE.BOOL.union(TYPE.INT).isSubtypeOf(TYPE.NULL.union(TYPE.BOOL).union(TYPE.INT.union(TYPE.FLOAT))),
				'`U | V <: (T | U) | (V | W)` but `!(U | V <: T | U)` and `!(U | V <: V | W)`',
			);
		});
		test.test('3-7 | `A <: C    &&  B <: C  <->  A \| B <: C`', () => {
			predicate3(builtin_types, (a, b, c) => {
				if (a.isSubtypeOf(c) && b.isSubtypeOf(c)) {
					assert.ok(a.union(b).isSubtypeOf(c), `forward: ${ a }, ${ b }, ${ c }`);
				}
				if (a.union(b).isSubtypeOf(c)) {
					assert.ok(a.isSubtypeOf(c) && b.isSubtypeOf(c), `backward: ${ a }, ${ b }, ${ c }`);
				}
			});
		});
		test.test('3-8 | `A <: C  \|\|  B <: C  -->  A  & B <: C`', () => {
			predicate3(builtin_types, (a, b, c) => {
				if (a.isSubtypeOf(c) || b.isSubtypeOf(c)) {
					assert.ok(a.intersect(b).isSubtypeOf(c), `${ a }, ${ b }, ${ c }`);
				}
			});
			assert.ok(
				TYPE.NULL.intersect(TYPE.INT).isSubtypeOf(TYPE.NULL.intersect(TYPE.INT)) &&
				!TYPE.NULL.isSubtypeOf(TYPE.NULL.intersect(TYPE.INT)) &&
				!TYPE.INT.isSubtypeOf(TYPE.NULL.intersect(TYPE.INT)),
				'exists A, B, C s.t. `A & B <: C` but `!(A <: C)` and `!(B <: C)`',
			);
		});

		test.test('discrete types.', () => {
			[
				TYPE.NULL,
				TYPE.BOOL,
				TYPE.SYM,
				TYPE.INT,
				TYPE.NAT,
				TYPE.FLOAT,
				TYPE.STR,
			].forEach((t, _, arr) => {
				arr.filter((u) => u !== t).forEach((u) => {
					assert.ok(!u.isSubtypeOf(t), `${ u }, ${ t }`);
				});
			});
		});

		test.test('a subtype of a union need not be a subtype of any of that union’s constituents.', () => {
			const left:  TYPE.Type = typeUnit(1n).union(typeUnit(2n));
			const right: TYPE.Type = typeUnit(3n);
			const sub:   TYPE.Type = typeUnit(2n).union(typeUnit(3n));
			assert.ok(sub.isSubtypeOf(left.union(right)), '2 | 3  <:  (1 | 2) | 3');
			assert.ok(!sub.isSubtypeOf(left),             '2 | 3  !<:  1 | 2');
			assert.ok(!sub.isSubtypeOf(right),            '2 | 3  !<:  3');
		});

		test.suite('Unit', () => {
			test.test('unit Boolean types should be subtypes of `bool`.', () => {
				assert.ok(TYPE.FALSE.isSubtypeOf(TYPE.BOOL), 'TYPE.FALSE');
				assert.ok(TYPE.TRUE .isSubtypeOf(TYPE.BOOL), 'TYPE.TRUE');
			});
			test.test('unit Integer types should be subtypes of `int`.', () => {
				[42n, -42n, 0n, -0n].map((v) => typeUnit(v)).forEach((itype) => {
					assert.ok(itype.isSubtypeOf(TYPE.INT), `${ itype }`);
				});
			});
			test.test('unit Float types should be subtypes of `float`.', () => {
				[4.2, -4.2e-2, 0.0, -0.0].map((v) => typeUnit(v)).forEach((ftype) => {
					assert.ok(ftype.isSubtypeOf(TYPE.FLOAT), `${ ftype }`);
				});
			});
			test.test('unit String types should be subtypes of `str`.', () => {
				['a4.2', 'b-4.2e-2', 'c0.0', 'd-0.0'].map((v) => typeUnit(v)).forEach((stype) => {
					assert.ok(stype.isSubtypeOf(TYPE.STR), `${ stype }`);
				});
			});
		});

		test.suite('Tuple', () => {
			test.test('is a subtype but not a supertype of `anything`.', () => {
				const tuple: TYPE.Tuple = TYPE.Tuple.fromTypes([
					TYPE.INT,
					TYPE.BOOL,
					TYPE.STR,
				]);
				assert.ok(tuple.isSubtypeOf(TYPE.ANYTHING), '(int, bool, str) <: anything;');
				assert.ok(!TYPE.ANYTHING.isSubtypeOf(tuple), 'anything !<: (int, bool, str)');
			});
			test.test('is neither a subtype nor a supertype of `Object`.', () => {
				const tuple: TYPE.Tuple = TYPE.Tuple.fromTypes([
					TYPE.INT,
					TYPE.BOOL,
					TYPE.STR,
				]);
				assert.ok(!tuple.isSubtypeOf(TYPE.OBJ), '(int, bool, str) !<: Object;');
				assert.ok(!TYPE.OBJ.isSubtypeOf(tuple), 'Object !<: (int, bool, str)');
			});
			test.test('matches per index.', () => {
				assert.ok(TYPE.Tuple.fromTypes([
					TYPE.INT,
					TYPE.BOOL,
					TYPE.STR,
				]).isSubtypeOf(TYPE.Tuple.fromTypes([
					TYPE.INT.union(TYPE.FLOAT),
					TYPE.BOOL.union(TYPE.NULL),
					TYPE.ANYTHING,
				])), '(int, bool, str) <: (int | float, bool?, anything);');
				assert.ok(!TYPE.Tuple.fromTypes([
					TYPE.INT,
					TYPE.BOOL,
					TYPE.STR,
				]).isSubtypeOf(TYPE.Tuple.fromTypes([
					TYPE.BOOL.union(TYPE.NULL),
					TYPE.OBJ,
					TYPE.INT.union(TYPE.FLOAT),
				])), '(int, bool, str) !<: (bool?, Object, int | float);');
			});
			test.test('returns false if assigned is smaller than assignee.', () => {
				assert.ok(!TYPE.Tuple.fromTypes([
					TYPE.INT,
					TYPE.BOOL,
				]).isSubtypeOf(TYPE.Tuple.fromTypes([
					TYPE.INT.union(TYPE.FLOAT),
					TYPE.BOOL.union(TYPE.NULL),
					TYPE.OBJ,
				])), '(int, bool) !<: (int | float, bool?, Object);');
			});
			test.test('skips rest if assigned is larger than assignee.', () => {
				assert.ok(TYPE.Tuple.fromTypes([
					TYPE.INT,
					TYPE.BOOL,
					TYPE.STR,
				]).isSubtypeOf(TYPE.Tuple.fromTypes([
					TYPE.INT.union(TYPE.FLOAT),
					TYPE.BOOL.union(TYPE.NULL),
				])), '(int, bool, str) <: (int | float, bool?);');
			});
			test.test('with optional entries, checks minimum count only.', () => {
				assert.ok(new TYPE.Tuple([
					{type: TYPE.INT, optional: false},
					{type: TYPE.INT, optional: false},
					{type: TYPE.INT, optional: true},
					{type: TYPE.INT, optional: true},
				]).isSubtypeOf(new TYPE.Tuple([
					{type: TYPE.INT, optional: false},
					{type: TYPE.INT, optional: true},
					{type: TYPE.INT, optional: true},
					{type: TYPE.INT, optional: true},
					{type: TYPE.INT, optional: true},
				])), '(int, int, ?:int, ?:int) <: (int, ?:int, ?:int, ?:int, ?:int)');
				assert.ok(!new TYPE.Tuple([
					{type: TYPE.INT, optional: false},
					{type: TYPE.INT, optional: true},
					{type: TYPE.INT, optional: true},
					{type: TYPE.INT, optional: true},
					{type: TYPE.INT, optional: true},
				]).isSubtypeOf(new TYPE.Tuple([
					{type: TYPE.INT, optional: false},
					{type: TYPE.INT, optional: false},
					{type: TYPE.INT, optional: true},
					{type: TYPE.INT, optional: true},
				])), '(int, ?:int, ?:int, ?:int, ?:int) !<: (int, int, ?:int, ?:int)');
			});
			test.test('Covariance for tuples: `A <: B --> Tuple.<A> <: Tuple.<B>`.', () => {
				assert.ok(TYPE.Tuple.fromTypes([TYPE.INT, TYPE.FLOAT]).isSubtypeOf(TYPE.Tuple.fromTypes([TYPE.INT.union(TYPE.NULL), TYPE.FLOAT.union(TYPE.NULL)])), '[int, float] <: [int?, float?]');
			});
			test.test('Tuple is never a subtype of List.', () => {
				assert.ok(!TYPE.Tuple.fromTypes([TYPE.INT]).isSubtypeOf(new TYPE.List(TYPE.INT, false)), '(int,) !<: int[]');
			});
		});

		test.suite('Record', () => {
			test.test('is a subtype but not a supertype of `anything`.', () => {
				const record: TYPE.Record = TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
					[0x102n, TYPE.STR],
				]));
				assert.ok(record.isSubtypeOf(TYPE.ANYTHING), '(x: int, y: bool, z: str) <: anything;');
				assert.ok(!TYPE.ANYTHING.isSubtypeOf(record), 'anything !<: (x: int, y: bool, z: str)');
			});
			test.test('is neither a subtype nor a supertype of `Object`.', () => {
				const record: TYPE.Record = TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
					[0x102n, TYPE.STR],
				]));
				assert.ok(!record.isSubtypeOf(TYPE.OBJ), '(x: int, y: bool, z: str) !<: Object;');
				assert.ok(!TYPE.OBJ.isSubtypeOf(record), 'Object !<: (x: int, y: bool, z: str)');
			});
			test.test('matches per key.', () => {
				assert.ok(TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
					[0x102n, TYPE.STR],
				])).isSubtypeOf(TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([
					[0x101n, TYPE.BOOL.union(TYPE.NULL)],
					[0x102n, TYPE.ANYTHING],
					[0x100n, TYPE.INT.union(TYPE.FLOAT)],
				]))), '(x: int, y: bool, z: str) <: (y: bool!, z: anything, x: int | float);');
				assert.ok(!TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
					[0x102n, TYPE.STR],
				])).isSubtypeOf(TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.BOOL.union(TYPE.NULL)],
					[0x101n, TYPE.OBJ],
					[0x102n, TYPE.INT.union(TYPE.FLOAT)],
				]))), '(x: int, y: bool, z: str) !<: (x: bool!, y: Object, z: int | float);');
			});
			test.test('returns false if assigned is smaller than assignee.', () => {
				assert.ok(!TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
				])).isSubtypeOf(TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([
					[0x101n, TYPE.BOOL.union(TYPE.NULL)],
					[0x102n, TYPE.OBJ],
					[0x100n, TYPE.INT.union(TYPE.FLOAT)],
				]))), '(x: int, y: bool) !<: (y: bool!, z: Object, x: int | float);');
			});
			test.test('skips rest if assigned is larger than assignee.', () => {
				assert.ok(TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
					[0x102n, TYPE.STR],
				])).isSubtypeOf(TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([
					[0x101n, TYPE.BOOL.union(TYPE.NULL)],
					[0x100n, TYPE.INT.union(TYPE.FLOAT)],
				]))), '(x: int, y: bool, z: str) <: (y: bool!, x: int | float);');
			});
			test.test('returns false if assignee contains keys that assigned does not.', () => {
				assert.ok(!TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
					[0x102n, TYPE.STR],
				])).isSubtypeOf(TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([
					[0x101n, TYPE.BOOL.union(TYPE.NULL)],
					[0x102n, TYPE.OBJ],
					[0x103n, TYPE.INT.union(TYPE.FLOAT)],
				]))), '(x: int, y: bool, z: str) !<: (y: bool!, z: Object, w: int | float)');
			});
			test.test('optional entries are not assignable to required entries.', () => {
				assert.ok(new TYPE.Record(new Map<bigint, EntryType>([
					[0x100n, {type: TYPE.STR,  optional: false}],
					[0x101n, {type: TYPE.INT,  optional: true}],
					[0x102n, {type: TYPE.BOOL, optional: false}],
				])).isSubtypeOf(new TYPE.Record(new Map<bigint, EntryType>([
					[0x100n, {type: TYPE.STR,  optional: true}],
					[0x101n, {type: TYPE.INT,  optional: true}],
					[0x102n, {type: TYPE.BOOL, optional: false}],
				]))), '(a: str, b?: int, c: bool) <: (a?: str, b?: int, c: bool)');
				assert.ok(!new TYPE.Record(new Map<bigint, EntryType>([
					[0x100n, {type: TYPE.STR,  optional: false}],
					[0x101n, {type: TYPE.INT,  optional: true}],
					[0x102n, {type: TYPE.BOOL, optional: false}],
				])).isSubtypeOf(new TYPE.Record(new Map<bigint, EntryType>([
					[0x100n, {type: TYPE.STR,  optional: true}],
					[0x101n, {type: TYPE.INT,  optional: false}],
					[0x102n, {type: TYPE.BOOL, optional: false}],
				]))), '(a: str, b?: int, c: bool) !<: (a?: str, b: int, c: bool)');
			});
			test.test('Covariance for records: `A <: B --> Record.<A> <: Record.<B>`.', () => {
				assert.ok(TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.FLOAT],
				])).isSubtypeOf(TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT.union(TYPE.NULL)],
					[0x101n, TYPE.FLOAT.union(TYPE.NULL)],
				]))), '(a: int, b: float) <: (a: int?, b: float?)');
			});
			test.test('Record is never a subtype of Dict.', () => {
				assert.ok(!TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.INT]])).isSubtypeOf(new TYPE.Dict(TYPE.INT, false)), '(a: int) !<: [: int]');
			});
		});

		test.suite('List', () => {
			test.test('is a subtype but not a supertype of `Object`.', () => {
				assert.ok(new TYPE.List(TYPE.INT.union(TYPE.BOOL)).isSubtypeOf(TYPE.OBJ), 'List.<int | bool> <: Object;');
				assert.ok(!TYPE.OBJ.isSubtypeOf(new TYPE.List(TYPE.INT.union(TYPE.BOOL))), 'Object !<: List.<int | bool>');
			});
			test.test('Covariance for immutable lists: `A <: B -->     List.<A> <:     List.<B>`.', () => {
				assert.ok(new TYPE.List(TYPE.INT).isSubtypeOf(new TYPE.List(TYPE.INT.union(TYPE.FLOAT))), 'List.<int> <: List.<int | float>');
				assert.ok(!new TYPE.List(TYPE.INT.union(TYPE.FLOAT)).isSubtypeOf(new TYPE.List(TYPE.INT)), 'List.<int | float> !<: List.<int>');
			});
			test.test('Invariance for   mutable lists: `A == B --> mut List.<A> <: mut List.<B>`.', () => {
				assert.ok(!new TYPE.List(TYPE.INT, true).isSubtypeOf(new TYPE.List(TYPE.INT.union(TYPE.FLOAT), true)), 'mut List.<int> !<: mut List.<int | float>');
			});
		});

		test.suite('Dict', () => {
			test.test('is a subtype but not a supertype of `Object`.', () => {
				assert.ok(new TYPE.Dict(TYPE.INT.union(TYPE.BOOL)).isSubtypeOf(TYPE.OBJ), 'Dict.<int | bool> <: Object;');
				assert.ok(!TYPE.OBJ.isSubtypeOf(new TYPE.Dict(TYPE.INT.union(TYPE.BOOL))), 'Object !<: Dict.<int | bool>');
			});
			test.test('Covariance for immutable dicts: `A <: B -->     Dict.<A> <:     Dict.<B>`.', () => {
				assert.ok(new TYPE.Dict(TYPE.INT).isSubtypeOf(new TYPE.Dict(TYPE.INT.union(TYPE.FLOAT))), 'Dict.<int> <: Dict.<int | float>');
				assert.ok(!new TYPE.Dict(TYPE.INT.union(TYPE.FLOAT)).isSubtypeOf(new TYPE.Dict(TYPE.INT)), 'Dict.<int | float> !<: Dict.<int>');
			});
			test.test('Invariance for   mutable dicts: `A == B --> mut Dict.<A> <: mut Dict.<B>`.', () => {
				assert.ok(!new TYPE.Dict(TYPE.INT, true).isSubtypeOf(new TYPE.Dict(TYPE.INT.union(TYPE.FLOAT), true)), 'mut Dict.<int> !<: mut Dict.<int | float>');
			});
		});

		test.suite('Set', () => {
			test.test('is a subtype but not a supertype of `Object`.', () => {
				assert.ok(new TYPE.Set(TYPE.INT).isSubtypeOf(TYPE.OBJ), 'Set.<int> <: Object');
				assert.ok(!TYPE.OBJ.isSubtypeOf(new TYPE.Set(TYPE.INT)), 'Object !<: Set.<int>');
			});
			test.test('Covariance for immutable sets: `A <: B -->     Set.<A> <:     Set.<B>`.', () => {
				assert.ok(new TYPE.Set(TYPE.INT).isSubtypeOf(new TYPE.Set(TYPE.INT.union(TYPE.FLOAT))), 'Set.<int> !<: Set.<int | float>');
				assert.ok(!new TYPE.Set(TYPE.INT.union(TYPE.FLOAT)).isSubtypeOf(new TYPE.Set(TYPE.INT)), 'Set.<int | float> !<: Set.<int>');
			});
			test.test('Invariance for   mutable sets: `A == B --> mut Set.<A> <: mut Set.<B>`.', () => {
				assert.ok(!new TYPE.Set(TYPE.INT, true).isSubtypeOf(new TYPE.Set(TYPE.INT.union(TYPE.FLOAT), true)), 'mut Set.<int> !<: mut Set.<int | float>');
			});
		});

		test.suite('Map', () => {
			test.test('is a subtype but not a supertype of `Object`.', () => {
				assert.ok(new TYPE.Map(TYPE.INT, TYPE.BOOL).isSubtypeOf(TYPE.OBJ), 'Map.<int, bool> <: Object');
				assert.ok(!TYPE.OBJ.isSubtypeOf(new TYPE.Map(TYPE.INT, TYPE.BOOL)), 'Object !<: Map.<int, bool>');
			});
			test.test('Covariance for immutable maps: `A <: C && B <: D -->     Map.<A, B> <:     Map.<C, D>`.', () => {
				const INT_BOOL       = new TYPE.Map(TYPE.INT,                 TYPE.BOOL);
				const INTSTR_BOOL    = new TYPE.Map(TYPE.INT.union(TYPE.STR), TYPE.BOOL);
				const INT_BOOLSTR    = new TYPE.Map(TYPE.INT,                 TYPE.BOOL.union(TYPE.STR));
				const INTSTR_BOOLSTR = new TYPE.Map(TYPE.INT.union(TYPE.STR), TYPE.BOOL.union(TYPE.STR));

				assert.ok(INT_BOOL.isSubtypeOf(INTSTR_BOOL),    'Map.<int, bool> <: Map.<int | str, bool>');
				assert.ok(INT_BOOL.isSubtypeOf(INT_BOOLSTR),    'Map.<int, bool> <: Map.<int,       bool | str>');
				assert.ok(INT_BOOL.isSubtypeOf(INTSTR_BOOLSTR), 'Map.<int, bool> <: Map.<int | str, bool | str>');

				assert.ok(!INTSTR_BOOL   .isSubtypeOf(INT_BOOL), 'Map.<int | str, bool>       !<: Map.<int, bool>');
				assert.ok(!INT_BOOLSTR   .isSubtypeOf(INT_BOOL), 'Map.<int,       bool | str> !<: Map.<int, bool>');
				assert.ok(!INTSTR_BOOLSTR.isSubtypeOf(INT_BOOL), 'Map.<int | str, bool | str> !<: Map.<int, bool>');
			});
			test.test('Invariance for   mutable maps: `A == C && B == D --> mut Map.<A, B> <: mut Map.<C, D>`.', () => {
				const INT_BOOL = new TYPE.Map(TYPE.INT, TYPE.BOOL, true);

				assert.ok(!INT_BOOL.isSubtypeOf(new TYPE.Map(TYPE.INT.union(TYPE.STR), TYPE.BOOL, true)),                 'mut Map.<int, bool> !<: mut Map.<int | str, bool>');
				assert.ok(!INT_BOOL.isSubtypeOf(new TYPE.Map(TYPE.INT,                 TYPE.BOOL.union(TYPE.STR), true)), 'mut Map.<int, bool> !<: mut Map.<int,       bool | str>');
				assert.ok(!INT_BOOL.isSubtypeOf(new TYPE.Map(TYPE.INT.union(TYPE.STR), TYPE.BOOL.union(TYPE.STR), true)), 'mut Map.<int, bool> !<: mut Map.<int | str, bool | str>');
			});
		});

		test.suite('TypeInterface', () => {
			test.test('returns `true` if the subtype contains at least the properties of the supertype.', () => {
				const t0 = new TYPE.TypeInterface(new Map<string, TYPE.Type>([
					['foo', TYPE.OBJ],
					['bar', TYPE.NULL],
					['diz', TYPE.BOOL],
				]));
				const t1 = new TYPE.TypeInterface(new Map<string, TYPE.Type>([
					['foo', TYPE.OBJ],
					['qux', TYPE.INT.union(TYPE.FLOAT)],
					['diz', TYPE.STR],
				]));
				assert.ok(!t0.isSubtypeOf(t1));
				assert.ok(!t1.isSubtypeOf(t0));
				assert.ok(new TYPE.TypeInterface(new Map<string, TYPE.Type>([
					['foo', TYPE.OBJ],
					['bar', TYPE.NULL],
					['diz', TYPE.TRUE],
					['qux', TYPE.INT.union(TYPE.FLOAT)],
				])).isSubtypeOf(t0));
			});
		});
	});


	test.suite('#equals', () => {
		test.test('bool == false | true', () => {
			assert.ok(TYPE.BOOL.equals(TYPE.FALSE.union(TYPE.TRUE)));
		});
		test.test('0.0 != -0.0', () => {
			assert.ok(!VALUE.FLOAT_0.identical(VALUE.FLOAT_N0), 'the values 0.0 and -0.0 are not identical (by value identity `===`)');
			assert.ok(VALUE.FLOAT_0.equal(VALUE.FLOAT_N0),      'the values 0.0 and -0.0 are equal (by value equality `==`)');
			assert.ok(!VALUE.FLOAT_0.toType().equals(VALUE.FLOAT_N0.toType()));
		});
		test.test('built-in types do not equal unit types of their canonical values.', () => {
			assert.ok(!TYPE.BOOL  .equals(TYPE.FALSE),       'bool  != false');
			assert.ok(!TYPE.BOOL  .equals(TYPE.TRUE),        'bool  != true');
			assert.ok(!TYPE.SYM   .equals(TYPE.SYM_NOTHING), 'sym   != @nothing');
			assert.ok(!TYPE.INT   .equals(typeUnit(0n)),     'int   != 0');
			assert.ok(!TYPE.INT   .equals(typeUnit(1n)),     'int   != 1');
			assert.ok(!TYPE.FLOAT .equals(typeUnit(0.0)),    'float != 0.0');
			assert.ok(!TYPE.FLOAT .equals(typeUnit(-0.0)),   'float != -0.0');
			assert.ok(!TYPE.STR   .equals(typeUnit('')),     'str   != ""');

			assert.ok(!TYPE.INT  .equals(typeUnit(0n) .union(typeUnit(1n))),   'int   != 0   | 1');
			assert.ok(!TYPE.FLOAT.equals(typeUnit(0.0).union(typeUnit(-0.0))), 'float != 0.0 | -0.0');
		});
	});


	test.suite('#mutableOf', () => {
		const examples: readonly TYPE.Type[] = [
			new TYPE.List(TYPE.BOOL),
			new TYPE.Dict(TYPE.BOOL),
			new TYPE.Set(TYPE.NULL),
			new TYPE.Map(TYPE.INT, TYPE.FLOAT),
		];
		test.test('mutable types are subtypes of their immutable counterparts.', () => {
			[
				...builtin_types,
				...examples,
			].forEach((t) => {
				assert.ok(t.mutableOf().isSubtypeOf(t), `mut ${ t } <: ${ t }`);
			});
		});
		test.test('non-constant mutable types are not equal to their immutable counterparts.', () => {
			examples.forEach((t) => {
				assert.ok(!t.mutableOf().equals(t), `mut ${ t } != ${ t }`);
			});
		});
		test.test('non-constant immutable types are not subtypes of their mutable counterparts.', () => {
			examples.forEach((t) => {
				assert.ok(!t.isSubtypeOf(t.mutableOf()), `${ t } !<: mut ${ t }`);
			});
		});
		test.suite('disributes over binary operations.', () => {
			const types: TYPE.Type[] = [
				...builtin_types,
				...examples,
			];
			test.test('mut (A - B) == mut A - mut B', () => {
				predicate2(types, (a, b) => {
					const difference: TYPE.Type = a.subtract(b).mutableOf();
					assert.ok(difference.equals(a.mutableOf().subtract(b.mutableOf())), `${ a }, ${ b }`);
					if (difference instanceof TYPE.Difference) {
						assert.ok(!difference.isMutable, 'Difference#isMutable === false');
					}
				});
			});
			test.test('mut (A & B) == mut A & mut B', () => {
				predicate2(types, (a, b) => {
					const intersection: TYPE.Type = a.intersect(b).mutableOf();
					assert.ok(intersection.equals(a.mutableOf().intersect(b.mutableOf())), `${ a }, ${ b }`);
					if (intersection instanceof TYPE.Intersection) {
						assert.ok(!intersection.isMutable, 'Intersection#isMutable === false');
					}
				});
			});
			test.test('mut (A | B) == mut A | mut B', () => {
				predicate2(types, (a, b) => {
					const union: TYPE.Type = a.union(b).mutableOf();
					assert.ok(union.equals(a.mutableOf().union(b.mutableOf())), `${ a }, ${ b }`);
					if (union instanceof TYPE.Union) {
						assert.ok(!union.isMutable, 'Union#isMutable === false');
					}
				});
			});
		});
	});


	test.suite('Combinable', () => {
		const a: TYPE.Record = TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.INT]]));
		const b: TYPE.Record = TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([[0x101n, TYPE.FLOAT]]));
		const c: TYPE.Record = TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([[0x102n, TYPE.STR]]));

		test.suite('#normalize', () => {
			test.suite('Intersection', () => {
				test.test('factors out common union operands from intersection: `(A \| B)  & (A \| C) == A \| (B  & C)`.', () => {
					const actual:   TYPE.Type = a.union(b).intersect(a.union(c));
					const expected: TYPE.Type = a.union(b.intersect(c));
					assert.ok(actual.equals(expected), `(${ a } | ${ b }) & (${ a } | ${ c }) == ${ a } | ${ b } & ${ c }`);
					return assert.deepStrictEqual(actual, expected, `${ actual } == ${ expected }`);
				});
			});

			test.suite('Union', () => {
				test.test('factors out common intersection operands from union: `(A  & B) \| (A  & C) == A  & (B \| C)`.', () => {
					const actual:   TYPE.Type = a.intersect(b).union(a.intersect(c));
					const expected: TYPE.Type = a.intersect(b.union(c));
					assert.ok(actual.equals(expected), `${ a } & ${ b } | ${ a } & ${ c } == ${ a } & (${ b } | ${ c })`);
					return assert.deepStrictEqual(actual, expected);
				});
			});
		});


		test.suite('#denormalize', () => {
			test.suite('Intersection', () => {
				test.test('distributes intersection operands over union: `(B \| C)  & A == (B  & A) \| (C  & A)`.', () => {
					const intersection: TYPE.Type = b.union(c).intersect(a);
					assert_instanceof(intersection, TYPE.Intersection);

					const as_union: TYPE.Type = intersection.denormalize();
					const expected            = new TYPE.Union(b.intersect(a), c.intersect(a));
					assert.ok(as_union.equals(expected), `(${ b } | ${ c }) & ${ a } == ${ b } & ${ a } | ${ c } & ${ a }`);
					return assert.deepStrictEqual(as_union, expected);
				});
			});

			test.suite('Union', () => {
				test.test('distributes union operands over intersection: `(B  & C) \| A == (B \| A)  & (C \| A)`.', () => {
					const union: TYPE.Type = b.intersect(c).union(a);
					assert_instanceof(union, TYPE.Union);

					const as_intersection: TYPE.Type = union.denormalize();
					const expected                   = new TYPE.Intersection(b.union(a), c.union(a));
					assert.ok(as_intersection.equals(expected), `${ b } & ${ c } | ${ a } == (${ b } | ${ a }) & (${ c } | ${ a })`);
					return assert.deepStrictEqual(as_intersection, expected);
				});
			});
		});
	});
	/* eslint-enable no-useless-escape */
});
