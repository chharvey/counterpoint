import * as assert from 'assert';
import {
	type TypeEntry,
	OBJ,
	TYPE,
} from '../../src/index.js';
import {assert_instanceof} from '../../src/lib/index.js';
import {typeUnit} from '../helpers.js';



describe('Type', () => {
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
		TYPE.NEVER,
		TYPE.UNKNOWN,
		TYPE.VOID,
		TYPE.OBJ,
		TYPE.NULL,
		TYPE.BOOL,
		TYPE.INT,
		TYPE.FLOAT,
		TYPE.STR,
	];


	it('a type operation equaling to a built-in type returns that type by reference.', () => {
		assert.strictEqual(TYPE.BOOL.intersect(TYPE.STR),                     TYPE.NEVER);
		assert.strictEqual(TYPE.BOOL.union(TYPE.UNKNOWN),                     TYPE.UNKNOWN);
		assert.strictEqual(OBJ.Boolean.FALSETYPE.union(OBJ.Boolean.TRUETYPE), TYPE.BOOL);
	});


	describe('#toString', () => {
		it('properly prioritizes operators.', () => {
			const a: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([TYPE.BOOL]);
			const b: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([TYPE.INT]);
			const c: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([TYPE.STR]);
			const tests = new Map<TYPE.Type, string>([
				[a.intersect(b).union(c), '[bool] & [int] | [str]'],
				[a.intersect(b.union(c)), '[bool] & ([int] | [str])'],
				[a.union(b).intersect(c), '([bool] | [int]) & [str]'],
				[a.union(b.intersect(c)), '[bool] | [int] & [str]'],
			]);
			return assert.deepStrictEqual([...tests.keys()].map((k) => k.toString()), [...tests.values()]);
		});
	});


	describe('#isDefinitelyFalsy', () => {
		const FALSE = OBJ.Boolean.FALSETYPE;
		it('only a combination of `never`, `void`, `null`, and `false` are definitely falsy.', () => {
			[
				TYPE.NEVER,
				TYPE.TypeUnion.all([                      FALSE]),
				TYPE.TypeUnion.all([           TYPE.NULL       ]),
				TYPE.TypeUnion.all([           TYPE.NULL, FALSE]),
				TYPE.TypeUnion.all([TYPE.VOID                  ]),
				TYPE.TypeUnion.all([TYPE.VOID,            FALSE]),
				TYPE.TypeUnion.all([TYPE.VOID, TYPE.NULL       ]),
				TYPE.TypeUnion.all([TYPE.VOID, TYPE.NULL, FALSE]),
			].forEach((t) => assert.ok(t.isDefinitelyFalsy(), `Expected \`${ t }\` to be definitely falsy.`));
		});
		it('any other types are not definitely falsy.', () => {
			[
				TYPE.UNKNOWN,
				TYPE.OBJ,
				OBJ.Boolean.TRUETYPE,
				TYPE.BOOL,
				TYPE.INT,
				TYPE.FLOAT,
				TYPE.STR,
				TYPE.VOID.union(TYPE.INT),
				TYPE.NULL.union(TYPE.FLOAT),
				FALSE.union(TYPE.STR),
			].forEach((t) => assert.ok(!t.isDefinitelyFalsy(), `Expected \`${ t }\` to not be definitely falsy.`));
		});
	});


	describe('#isDefinitelyTruthy', () => {
		const FALSE = OBJ.Boolean.FALSETYPE;
		it('all definitely falsy types are not definitely truthy.', () => {
			[
				TYPE.NEVER,
				TYPE.TypeUnion.all([                      FALSE]),
				TYPE.TypeUnion.all([           TYPE.NULL       ]),
				TYPE.TypeUnion.all([           TYPE.NULL, FALSE]),
				TYPE.TypeUnion.all([TYPE.VOID                  ]),
				TYPE.TypeUnion.all([TYPE.VOID,            FALSE]),
				TYPE.TypeUnion.all([TYPE.VOID, TYPE.NULL       ]),
				TYPE.TypeUnion.all([TYPE.VOID, TYPE.NULL, FALSE]),
			].forEach((t) => assert.ok(!t.isDefinitelyTruthy(), `Expected \`${ t }\` to not be definitely truthy.`));
		});
		it('unions of falsy types are not definitely truthy.', () => {
			[
				TYPE.UNKNOWN,
				TYPE.BOOL,
				TYPE.VOID.union(TYPE.INT),
				TYPE.NULL.union(TYPE.FLOAT),
				FALSE.union(TYPE.STR),
			].forEach((t) => assert.ok(!t.isDefinitelyTruthy(), `Expected \`${ t }\` to not be definitely truthy.`));
		});
		it('“valuable” primitive types are definitely truthy.', () => {
			[
				OBJ.Boolean.TRUETYPE,
				TYPE.INT,
				TYPE.FLOAT,
				TYPE.STR,
			].forEach((t) => assert.ok(t.isDefinitelyTruthy(), `Expected \`${ t }\` to be definitely truthy.`));
		});
		it('compound value types are definitely truthy.', () => {
			[
				TYPE.TypeTuple.fromTypes(),
				TYPE.TypeRecord.fromTypes(new Map([[0x100n, TYPE.INT]])),
			].forEach((t) => assert.ok(t.isDefinitelyTruthy(), `Expected \`${ t }\` to be definitely truthy.`));
		});
		it('reference types are definitely truthy.', () => {
			[
				TYPE.OBJ,
				new TYPE.TypeList(TYPE.INT),
				new TYPE.TypeDict(TYPE.INT),
				new TYPE.TypeSet(TYPE.INT),
				new TYPE.TypeMap(TYPE.INT, TYPE.INT),
			].forEach((t) => assert.ok(t.isDefinitelyTruthy(), `Expected \`${ t }\` to be definitely truthy.`));
		});
	});


	specify('#falsySide', () => {
		const FALSE = OBJ.Boolean.FALSETYPE;
		return new Map<TYPE.Type, TYPE.Type>([
			[TYPE.NEVER,   TYPE.NEVER],
			[TYPE.UNKNOWN, TYPE.VOID.union(TYPE.NULL).union(FALSE)],
			[TYPE.VOID,    TYPE.VOID],
			[TYPE.OBJ,     TYPE.NEVER],
			[TYPE.NULL,    TYPE.NULL],
			[TYPE.BOOL,    FALSE],
			[TYPE.INT,     TYPE.NEVER],
			[TYPE.FLOAT,   TYPE.NEVER],
			[TYPE.STR,     TYPE.NEVER],
		]).forEach((right, left) => assert.ok(left.falsySide().equals(right), `${ left.falsySide() } == ${ right }`));
	});


	specify('#truthySide', () => {
		new Map<TYPE.Type, TYPE.Type>([
			[TYPE.NEVER,   TYPE.NEVER],
			[TYPE.VOID,    TYPE.NEVER],
			[TYPE.NULL,    TYPE.NEVER],
			[TYPE.BOOL,    OBJ.Boolean.TRUETYPE],
			[TYPE.INT,     TYPE.INT],
			[TYPE.FLOAT,   TYPE.FLOAT],
			[TYPE.STR,     TYPE.STR],
		]).forEach((right, left) => assert.ok(left.truthySide().equals(right), `${ left.truthySide() } == ${ right }`));
	});


	describe('#includes', () => {
		it('uses `Object#identical` to compare values.', () => {
			function unionOfInts(ns: readonly bigint[]): TYPE.Type {
				return TYPE.TypeUnion.all(ns.map((v) => typeUnit(v)));
			}
			function unionOfFloats(ns: readonly number[]): TYPE.Type {
				return TYPE.TypeUnion.all(ns.map((v) => typeUnit(v)));
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
			].map((ns) => new Set<OBJ.Float>(ns.map((n) => new OBJ.Float(n)))), '(4.2 | 4.3 | 4.4) & (4.3 | 4.4 | 4.5) == (4.3 | 4.4)');
			assert.deepStrictEqual([
				u3,
				u4,
				u3.union(u4),
			].map((typ) => typ.values), [
				[42n, 43n, 44n],
				[43n, 44n, 45n],
				[42n, 43n, 44n, 45n],
			].map((ns) => new Set<OBJ.Integer>(ns.map((n) => new OBJ.Integer(n)))), '(42 | 43 | 44) | (43 | 44 | 45) == (42 | 43 | 44 | 45)');
		});
	});


	describe('#intersect', () => {
		it('1-5 | `T  & never   == never`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.intersect(TYPE.NEVER).isBottomType, `${ t }`);
			});
		});
		it('1-6 | `T  & unknown == T`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.intersect(TYPE.UNKNOWN).equals(t), `${ t }`);
			});
		});
		it('2-1 | `A  & B == B  & A`', () => {
			predicate2(builtin_types, (a, b) => {
				assert.ok(a.intersect(b).equals(b.intersect(a)), `${ a }, ${ b }`);
			});
		});
		it('2-3 | `(A  & B)  & C == A  & (B  & C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.intersect(b).intersect(c).equals(a.intersect(b.intersect(c))), `${ a }, ${ b }, ${ c }`);
			});
		});
		it('2-5 | `A  & (B \| C) == (A  & B) \| (A  & C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.intersect(b.union(c)).equals(a.intersect(b).union(a.intersect(c))), `${ a }, ${ b }, ${ c }`);
			});
		});
		it('3-9 | `C <: A --> (A  & B)  & C == B  & C`', () => {
			const a: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([TYPE.BOOL, TYPE.INT]);
			const b: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([OBJ.Boolean.TRUETYPE]);
			const c: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([OBJ.Boolean.FALSETYPE, typeUnit(42n)]);
			const actual:   TYPE.Type = a.intersect(b).intersect(c);
			const expected: TYPE.Type = b.intersect(c);
			assert.ok(actual.equals(expected), '([bool, int] & [true]) & [false, 42] == [true] & [false, 42]');
			assert.deepStrictEqual(actual, expected);
		});
		describe('TypeIntersection', () => {
			it('optimizes nested intersections: `(A & B) & A === A & B`', () => {
				const a: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([TYPE.BOOL, TYPE.INT]);
				const b: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([OBJ.Boolean.TRUETYPE]);
				const expected: TYPE.Type = a.intersect(b);
				assert.strictEqual(expected.intersect(a), expected);
			});
			it('switches operands when calling same operator.', () => {
				const a: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([TYPE.BOOL]);
				const b: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([TYPE.INT]);
				const c: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([TYPE.STR]);
				assert.deepStrictEqual(
					[a.intersect(b).intersect(c),                  a.intersect(b.intersect(c))],
					[new TYPE.TypeIntersection(a.intersect(b), c), new TYPE.TypeIntersection(b.intersect(c), a)],
				);
				return assert.notDeepStrictEqual(a.intersect(b.intersect(c)), new TYPE.TypeIntersection(a.intersect(b), c));
			});
			it('doesn’t stack overflow.', () => {
				const a_int:   TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.INT]]));   // [a: int]
				const a_float: TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.FLOAT]])); // [a: float]
				const b_int:   TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x101n, TYPE.INT]]));   // [b: int]
				const b_float: TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x101n, TYPE.FLOAT]])); // [b: float]
				const left:  TYPE.Type = a_int  .intersect(b_float);
				const right: TYPE.Type = a_float.intersect(b_int);
				assert_instanceof(left,  TYPE.TypeIntersection);
				assert_instanceof(right, TYPE.TypeIntersection);
				left.intersect(right); // assert does not throw
			});
		});
	});


	describe('#union', () => {
		it('1-7 | `T \| never   == T`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.union(TYPE.NEVER).equals(t), `${ t }`);
			});
		});
		it('1-8 | `T \| unknown == unknown`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.union(TYPE.UNKNOWN).isTopType, `${ t }`);
			});
		});
		it('2-2 | `A \| B == B \| A`', () => {
			predicate2(builtin_types, (a, b) => {
				assert.ok(a.union(b).equals(b.union(a)), `${ a }, ${ b }`);
			});
		});
		it('2-4 | `(A \| B) \| C == A \| (B \| C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.union(b).union(c).equals(a.union(b.union(c))), `${ a }, ${ b }, ${ c }`);
			});
		});
		it('2-6 | `A \| (B  & C) == (A \| B)  & (A \| C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.union(b.intersect(c)).equals(a.union(b).intersect(a.union(c))), `${ a }, ${ b }, ${ c }`);
			});
		});
		it('3-a | `A <: C --> (A \| B) \| C == B \| C`', () => {
			const a: TYPE.Type = typeUnit(4.2);
			const b: TYPE.Type = typeUnit(42n);
			const c: TYPE.Type = TYPE.FLOAT;
			const actual:   TYPE.Type = a.union(b).union(c);
			const expected: TYPE.Type = b.union(c);
			assert.ok(actual.equals(expected), '(4.2 | 42) | float == 42 | float');
			assert.deepStrictEqual(actual, expected);
		});
		describe('TypeUnion', () => {
			it('optimizes nested unions: `(A | B) | A === A | B`', () => {
				const a: TYPE.Type = typeUnit(4.2);
				const b: TYPE.Type = typeUnit(42n);
				const expected: TYPE.Type = a.union(b);
				assert.strictEqual(expected.union(a), expected);
			});
			it('switches operands when calling same operator.', () => {
				const a: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([TYPE.BOOL]);
				const b: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([TYPE.INT]);
				const c: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([TYPE.STR]);
				assert.deepStrictEqual(
					[a.union(b).union(c),               a.union(b.union(c))],
					[new TYPE.TypeUnion(a.union(b), c), new TYPE.TypeUnion(b.union(c), a)],
				);
				return assert.notDeepStrictEqual(a.union(b.union(c)), new TYPE.TypeUnion(a.union(b), c));
			});
			it('doesn’t stack overflow.', () => {
				const a_int:   TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.INT]]));   // [a: int]
				const a_float: TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.FLOAT]])); // [a: float]
				const b_int:   TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x101n, TYPE.INT]]));   // [b: int]
				const b_float: TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x101n, TYPE.FLOAT]])); // [b: float]
				const left:  TYPE.Type = a_int  .union(b_float);
				const right: TYPE.Type = a_float.union(b_int);
				assert_instanceof(left,  TYPE.TypeUnion);
				assert_instanceof(right, TYPE.TypeUnion);
				left.union(right); // assert does not throw
			});
		});
	});


	describe('#subtract', () => {
		it('4-1 | `A - B == A  <->  A & B == never`', () => {
			predicate2(builtin_types, (a, b) => {
				if (a.intersect(b).isBottomType) {
					assert.ok(a.subtract(b).equals(a), `forward: ${ a }, ${ b }`);
				}
				if (a.subtract(b).equals(a)) {
					assert.ok(a.intersect(b).isBottomType, `backward: ${ a }, ${ b }`);
				}
			});
		});
		it('4-2 | `A - B == never  <->  A <: B`', () => {
			predicate2(builtin_types, (a, b) => {
				if (a.isSubtypeOf(b)) {
					assert.ok(a.subtract(b).isBottomType, `forward: ${ a }, ${ b }`);
				}
				if (a.subtract(b).isBottomType) {
					assert.ok(a.isSubtypeOf(b), `forward: ${ a }, ${ b }`);
				}
			});
		});
		it('4-3 | `A <: B - C  <->  A <: B  &&  A & C == never`', () => {
			predicate3(builtin_types, (a, b, c) => {
				if (a.isSubtypeOf(b.subtract(c))) {
					assert.ok(a.isSubtypeOf(b) && a.intersect(c).isBottomType, `forward: ${ a }, ${ b }, ${ c }`);
				}
				if (a.isSubtypeOf(b) && a.intersect(c).isBottomType) {
					assert.ok(a.isSubtypeOf(b.subtract(c)), `forward: ${ a }, ${ b }, ${ c }`);
				}
			});
		});
		it('4-4 | `(A \| B) - C == (A - C) \| (B - C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.union(b).subtract(c).equals(a.subtract(c).union(b.subtract(c))), `${ a }, ${ b }, ${ c }`);
			});
		});
		it('4-5 | `A - (B \| C) == (A - B)  & (A - C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.subtract(b.union(c)).equals(a.subtract(b).intersect(a.subtract(c))), `${ a }, ${ b }, ${ c }`);
			});
		});
	});


	describe('#isSubtypeOf', () => {
		it('1-1 | `never <: T`', () => {
			builtin_types.forEach((t) => {
				assert.ok(TYPE.NEVER.isSubtypeOf(t), `${ t }`);
			});
		});
		it('1-2 | `T     <: unknown`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.isSubtypeOf(TYPE.UNKNOWN), `${ t }`);
			});
		});
		it('1-3 | `T       <: never  <->  T == never`', () => {
			builtin_types.forEach((t) => {
				if (t.isSubtypeOf(TYPE.NEVER)) {
					assert.ok(t.isBottomType, `${ t }`);
				}
			});
		});
		it('1-4 | `unknown <: T      <->  T == unknown`', () => {
			builtin_types.forEach((t) => {
				if (TYPE.UNKNOWN.isSubtypeOf(t)) {
					assert.ok(t.isTopType, `${ t }`);
				}
			});
		});
		it('2-7 | `A <: A`', () => {
			builtin_types.forEach((a) => {
				assert.ok(a.isSubtypeOf(a), `${ a }`);
			});
		});
		it('2-8 | `A <: B  &&  B <: A  -->  A == B`', () => {
			predicate2(builtin_types, (a, b) => {
				if (a.isSubtypeOf(b) && b.isSubtypeOf(a)) {
					assert.ok(a.equals(b), `${ a }, ${ b }`);
				}
			});
		});
		it('2-9 | `A <: B  &&  B <: C  -->  A <: C`', () => {
			predicate3(builtin_types, (a, b, c) => {
				if (a.isSubtypeOf(b) && b.isSubtypeOf(c)) {
					assert.ok(a.isSubtypeOf(c), `${ a }, ${ b }, ${ c }`);
				}
			});
		});
		it('3-1 | `A  & B <: A  &&  A  & B <: B`', () => {
			predicate2(builtin_types, (a, b) => {
				assert.ok(a.intersect(b).isSubtypeOf(a), `${ a }, ${ b }`);
				assert.ok(a.intersect(b).isSubtypeOf(b), `${ a }, ${ b }`);
			});
		});
		it('3-2 | `A <: A \| B  &&  B <: A \| B`', () => {
			predicate2(builtin_types, (a, b) => {
				assert.ok(a.isSubtypeOf(a.union(b)), `${ a }, ${ b }`);
				assert.ok(b.isSubtypeOf(a.union(b)), `${ a }, ${ b }`);
			});
		});
		it('3-3 | `A <: B  <->  A  & B == A`', () => {
			predicate2(builtin_types, (a, b) => {
				if (a.isSubtypeOf(b)) {
					assert.ok(a.intersect(b).equals(a), `forward: ${ a }, ${ b }`);
				}
				if (a.intersect(b).equals(a)) {
					assert.ok(a.isSubtypeOf(b), `backward: ${ a }, ${ b }`);
				}
			});
		});
		it('3-4 | `A <: B  <->  A \| B == B`', () => {
			predicate2(builtin_types, (a, b) => {
				if (a.isSubtypeOf(b)) {
					assert.ok(a.union(b).equals(b), `forward: ${ a }, ${ b }`);
				}
				if (a.union(b).equals(b)) {
					assert.ok(a.isSubtypeOf(b), `backward: ${ a }, ${ b }`);
				}
			});
		});
		it('3-5 | `A <: C    &&  A <: D  <->  A <: C  & D`', () => {
			predicate3(builtin_types, (a, c, d) => {
				if (a.isSubtypeOf(c) && a.isSubtypeOf(d)) {
					assert.ok(a.isSubtypeOf(c.intersect(d)), `forward: ${ a }, ${ c }, ${ d }`);
				}
				if (a.isSubtypeOf(c.intersect(d))) {
					assert.ok(a.isSubtypeOf(c) && a.isSubtypeOf(d), `backward: ${ a }, ${ c }, ${ d }`);
				}
			});
		});
		it('3-6 | `A <: C  \|\|  A <: D  -->  A <: C \| D`', () => {
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
		it('3-7 | `A <: C    &&  B <: C  <->  A \| B <: C`', () => {
			predicate3(builtin_types, (a, b, c) => {
				if (a.isSubtypeOf(c) && b.isSubtypeOf(c)) {
					assert.ok(a.union(b).isSubtypeOf(c), `forward: ${ a }, ${ b }, ${ c }`);
				}
				if (a.union(b).isSubtypeOf(c)) {
					assert.ok(a.isSubtypeOf(c) && b.isSubtypeOf(c), `backward: ${ a }, ${ b }, ${ c }`);
				}
			});
		});
		it('3-8 | `A <: C  \|\|  B <: C  -->  A  & B <: C`', () => {
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

		it('discrete types.', () => {
			[
				TYPE.VOID,
				TYPE.NULL,
				TYPE.BOOL,
				TYPE.INT,
				TYPE.FLOAT,
				TYPE.STR,
			].forEach((t, _, arr) => {
				arr.filter((u) => u !== t).forEach((u) => {
					assert.ok(!u.isSubtypeOf(t), `${ u }, ${ t }`);
				});
			});
		});

		it('a subtype of a union need not be a subtype of any of that union’s constituents.', () => {
			const left:  TYPE.Type = typeUnit(1n).union(typeUnit(2n));
			const right: TYPE.Type = typeUnit(3n);
			const sub:   TYPE.Type = typeUnit(2n).union(typeUnit(3n));
			assert.ok(sub.isSubtypeOf(left.union(right)), '2 | 3  <:  (1 | 2) | 3');
			assert.ok(!sub.isSubtypeOf(left),             '2 | 3  !<:  1 | 2');
			assert.ok(!sub.isSubtypeOf(right),            '2 | 3  !<:  3');
		});

		describe('TypeUnit', () => {
			it('unit Boolean types should be subtypes of `bool`.', () => {
				assert.ok(OBJ.Boolean.FALSETYPE.isSubtypeOf(TYPE.BOOL), 'Boolean.FALSETYPE');
				assert.ok(OBJ.Boolean.TRUETYPE .isSubtypeOf(TYPE.BOOL), 'Boolean.TRUETYPE');
			});
			it('unit Integer types should be subtypes of `int`.', () => {
				[42n, -42n, 0n, -0n].map((v) => typeUnit(v)).forEach((itype) => {
					assert.ok(itype.isSubtypeOf(TYPE.INT), `${ itype }`);
				});
			});
			it('unit Float types should be subtypes of `float`.', () => {
				[4.2, -4.2e-2, 0.0, -0.0].map((v) => typeUnit(v)).forEach((ftype) => {
					assert.ok(ftype.isSubtypeOf(TYPE.FLOAT), `${ ftype }`);
				});
			});
			it('unit String types should be subtypes of `str`.', () => {
				['a4.2', 'b-4.2e-2', 'c0.0', 'd-0.0'].map((v) => typeUnit(v)).forEach((stype) => {
					assert.ok(stype.isSubtypeOf(TYPE.STR), `${ stype }`);
				});
			});
		});

		describe('TypeTuple', () => {
			it('is a subtype but not a supertype of `unknown`.', () => {
				const tuple: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([
					TYPE.INT,
					TYPE.BOOL,
					TYPE.STR,
				]);
				assert.ok(tuple.isSubtypeOf(TYPE.UNKNOWN), '[int, bool, str] <: unknown;');
				assert.ok(!TYPE.UNKNOWN.isSubtypeOf(tuple), 'unknown !<: [int, bool, str]');
			});
			it('is neither a subtype nor a supertype of `Object`.', () => {
				const tuple: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([
					TYPE.INT,
					TYPE.BOOL,
					TYPE.STR,
				]);
				assert.ok(!tuple.isSubtypeOf(TYPE.OBJ), '[int, bool, str] !<: Object;');
				assert.ok(!TYPE.OBJ.isSubtypeOf(tuple), 'Object !<: [int, bool, str]');
			});
			it('matches per index.', () => {
				assert.ok(TYPE.TypeTuple.fromTypes([
					TYPE.INT,
					TYPE.BOOL,
					TYPE.STR,
				]).isSubtypeOf(TYPE.TypeTuple.fromTypes([
					TYPE.INT.union(TYPE.FLOAT),
					TYPE.BOOL.union(TYPE.NULL),
					TYPE.UNKNOWN,
				])), '[int, bool, str] <: [int | float, bool?, unknown];');
				assert.ok(!TYPE.TypeTuple.fromTypes([
					TYPE.INT,
					TYPE.BOOL,
					TYPE.STR,
				]).isSubtypeOf(TYPE.TypeTuple.fromTypes([
					TYPE.BOOL.union(TYPE.NULL),
					TYPE.OBJ,
					TYPE.INT.union(TYPE.FLOAT),
				])), '[int, bool, str] !<: [bool?, Object, int | float];');
			});
			it('returns false if assigned is smaller than assignee.', () => {
				assert.ok(!TYPE.TypeTuple.fromTypes([
					TYPE.INT,
					TYPE.BOOL,
				]).isSubtypeOf(TYPE.TypeTuple.fromTypes([
					TYPE.INT.union(TYPE.FLOAT),
					TYPE.BOOL.union(TYPE.NULL),
					TYPE.OBJ,
				])), '[int, bool] !<: [int | float, bool?, Object];');
			});
			it('skips rest if assigned is larger than assignee.', () => {
				assert.ok(TYPE.TypeTuple.fromTypes([
					TYPE.INT,
					TYPE.BOOL,
					TYPE.STR,
				]).isSubtypeOf(TYPE.TypeTuple.fromTypes([
					TYPE.INT.union(TYPE.FLOAT),
					TYPE.BOOL.union(TYPE.NULL),
				])), '[int, bool, str] <: [int | float, bool?];');
			});
			it('with optional entries, checks minimum count only.', () => {
				assert.ok(new TYPE.TypeTuple([
					{type: TYPE.INT, optional: false},
					{type: TYPE.INT, optional: false},
					{type: TYPE.INT, optional: true},
					{type: TYPE.INT, optional: true},
				]).isSubtypeOf(new TYPE.TypeTuple([
					{type: TYPE.INT, optional: false},
					{type: TYPE.INT, optional: true},
					{type: TYPE.INT, optional: true},
					{type: TYPE.INT, optional: true},
					{type: TYPE.INT, optional: true},
				])), '[int, int, ?:int, ?:int] <: [int, ?:int, ?:int, ?:int, ?:int]');
				assert.ok(!new TYPE.TypeTuple([
					{type: TYPE.INT, optional: false},
					{type: TYPE.INT, optional: true},
					{type: TYPE.INT, optional: true},
					{type: TYPE.INT, optional: true},
					{type: TYPE.INT, optional: true},
				]).isSubtypeOf(new TYPE.TypeTuple([
					{type: TYPE.INT, optional: false},
					{type: TYPE.INT, optional: false},
					{type: TYPE.INT, optional: true},
					{type: TYPE.INT, optional: true},
				])), '[int, ?:int, ?:int, ?:int, ?:int] !<: [int, int, ?:int, ?:int]');
			});
			it('Covariance for tuples: `A <: B --> Tuple.<A> <: Tuple.<B>`.', () => {
				assert.ok(TYPE.TypeTuple.fromTypes([TYPE.INT, TYPE.FLOAT]).isSubtypeOf(TYPE.TypeTuple.fromTypes([TYPE.INT.union(TYPE.NULL), TYPE.FLOAT.union(TYPE.NULL)])), '[int, float] <: [int?, float?]');
			});
			it('Tuple is never a subtype of List.', () => {
				assert.ok(!TYPE.TypeTuple.fromTypes([TYPE.INT]).isSubtypeOf(new TYPE.TypeList(TYPE.INT, false)), '[int] !<: int[]');
			});
		});

		describe('TypeRecord', () => {
			it('is a subtype but not a supertype of `unknown`.', () => {
				const record: TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
					[0x102n, TYPE.STR],
				]));
				assert.ok(record.isSubtypeOf(TYPE.UNKNOWN), '[x: int, y: bool, z: str] <: unknown;');
				assert.ok(!TYPE.UNKNOWN.isSubtypeOf(record), 'unknown !<: [x: int, y: bool, z: str]');
			});
			it('is neither a subtype nor a supertype of `Object`.', () => {
				const record: TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
					[0x102n, TYPE.STR],
				]));
				assert.ok(!record.isSubtypeOf(TYPE.OBJ), '[x: int, y: bool, z: str] !<: Object;');
				assert.ok(!TYPE.OBJ.isSubtypeOf(record), 'Object !<: [x: int, y: bool, z: str]');
			});
			it('matches per key.', () => {
				assert.ok(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
					[0x102n, TYPE.STR],
				])).isSubtypeOf(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x101n, TYPE.BOOL.union(TYPE.NULL)],
					[0x102n, TYPE.UNKNOWN],
					[0x100n, TYPE.INT.union(TYPE.FLOAT)],
				]))), '[x: int, y: bool, z: str] <: [y: bool!, z: unknown, x: int | float];');
				assert.ok(!TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
					[0x102n, TYPE.STR],
				])).isSubtypeOf(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.BOOL.union(TYPE.NULL)],
					[0x101n, TYPE.OBJ],
					[0x102n, TYPE.INT.union(TYPE.FLOAT)],
				]))), '[x: int, y: bool, z: str] !<: [x: bool!, y: Object, z: int | float];');
			});
			it('returns false if assigned is smaller than assignee.', () => {
				assert.ok(!TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
				])).isSubtypeOf(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x101n, TYPE.BOOL.union(TYPE.NULL)],
					[0x102n, TYPE.OBJ],
					[0x100n, TYPE.INT.union(TYPE.FLOAT)],
				]))), '[x: int, y: bool] !<: [y: bool!, z: Object, x: int | float];');
			});
			it('skips rest if assigned is larger than assignee.', () => {
				assert.ok(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
					[0x102n, TYPE.STR],
				])).isSubtypeOf(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x101n, TYPE.BOOL.union(TYPE.NULL)],
					[0x100n, TYPE.INT.union(TYPE.FLOAT)],
				]))), '[x: int, y: bool, z: str] <: [y: bool!, x: int | float];');
			});
			it('returns false if assignee contains keys that assigned does not.', () => {
				assert.ok(!TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
					[0x102n, TYPE.STR],
				])).isSubtypeOf(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x101n, TYPE.BOOL.union(TYPE.NULL)],
					[0x102n, TYPE.OBJ],
					[0x103n, TYPE.INT.union(TYPE.FLOAT)],
				]))), '[x: int, y: bool, z: str] !<: [y: bool!, z: Object, w: int | float]');
			});
			it('optional entries are not assignable to required entries.', () => {
				assert.ok(new TYPE.TypeRecord(new Map<bigint, TypeEntry>([
					[0x100n, {type: TYPE.STR,  optional: false}],
					[0x101n, {type: TYPE.INT,  optional: true}],
					[0x102n, {type: TYPE.BOOL, optional: false}],
				])).isSubtypeOf(new TYPE.TypeRecord(new Map<bigint, TypeEntry>([
					[0x100n, {type: TYPE.STR,  optional: true}],
					[0x101n, {type: TYPE.INT,  optional: true}],
					[0x102n, {type: TYPE.BOOL, optional: false}],
				]))), '[a: str, b?: int, c: bool] <: [a?: str, b?: int, c: bool]');
				assert.ok(!new TYPE.TypeRecord(new Map<bigint, TypeEntry>([
					[0x100n, {type: TYPE.STR,  optional: false}],
					[0x101n, {type: TYPE.INT,  optional: true}],
					[0x102n, {type: TYPE.BOOL, optional: false}],
				])).isSubtypeOf(new TYPE.TypeRecord(new Map<bigint, TypeEntry>([
					[0x100n, {type: TYPE.STR,  optional: true}],
					[0x101n, {type: TYPE.INT,  optional: false}],
					[0x102n, {type: TYPE.BOOL, optional: false}],
				]))), '[a: str, b?: int, c: bool] !<: [a?: str, b: int, c: bool]');
			});
			it('Covariance for records: `A <: B --> Record.<A> <: Record.<B>`.', () => {
				assert.ok(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.FLOAT],
				])).isSubtypeOf(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT.union(TYPE.NULL)],
					[0x101n, TYPE.FLOAT.union(TYPE.NULL)],
				]))), '[a: int, b: float] <: [a: int?, b: float?]');
			});
			it('Record is never a subtype of Dict.', () => {
				assert.ok(!TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.INT]])).isSubtypeOf(new TYPE.TypeDict(TYPE.INT, false)), '[a: int] !<: [: int]');
			});
		});

		describe('TypeList', () => {
			it('is a subtype but not a supertype of `Object`.', () => {
				assert.ok(new TYPE.TypeList(TYPE.INT.union(TYPE.BOOL)).isSubtypeOf(TYPE.OBJ), 'List.<int | bool> <: Object;');
				assert.ok(!TYPE.OBJ.isSubtypeOf(new TYPE.TypeList(TYPE.INT.union(TYPE.BOOL))), 'Object !<: List.<int | bool>');
			});
			it('Covariance for immutable lists: `A <: B --> List.<A> <: List.<B>`.', () => {
				assert.ok(new TYPE.TypeList(TYPE.INT).isSubtypeOf(new TYPE.TypeList(TYPE.INT.union(TYPE.FLOAT))), 'List.<int> <: List.<int | float>');
				assert.ok(!new TYPE.TypeList(TYPE.INT.union(TYPE.FLOAT)).isSubtypeOf(new TYPE.TypeList(TYPE.INT)), 'List.<int | float> !<: List.<int>');
			});
			it('Invariance for mutable lists: `A == B --> mut List.<A> <: mut List.<B>`.', () => {
				assert.ok(!new TYPE.TypeList(TYPE.INT, true).isSubtypeOf(new TYPE.TypeList(TYPE.INT.union(TYPE.FLOAT), true)), 'mut List.<int> !<: mut List.<int | float>');
			});
		});

		describe('TypeDict', () => {
			it('is a subtype but not a supertype of `Object`.', () => {
				assert.ok(new TYPE.TypeDict(TYPE.INT.union(TYPE.BOOL)).isSubtypeOf(TYPE.OBJ), 'Dict.<int | bool> <: Object;');
				assert.ok(!TYPE.OBJ.isSubtypeOf(new TYPE.TypeDict(TYPE.INT.union(TYPE.BOOL))), 'Object !<: Dict.<int | bool>');
			});
			it('Covariance for immutable dicts: `A <: B --> Dict.<A> <: Dict.<B>`.', () => {
				assert.ok(new TYPE.TypeDict(TYPE.INT).isSubtypeOf(new TYPE.TypeDict(TYPE.INT.union(TYPE.FLOAT))), 'Dict.<int> <: Dict.<int | float>');
				assert.ok(!new TYPE.TypeDict(TYPE.INT.union(TYPE.FLOAT)).isSubtypeOf(new TYPE.TypeDict(TYPE.INT)), 'Dict.<int | float> !<: Dict.<int>');
			});
			it('Invariance for mutable dicts: `A == B --> mut Dict.<A> <: mut Dict.<B>`.', () => {
				assert.ok(!new TYPE.TypeDict(TYPE.INT, true).isSubtypeOf(new TYPE.TypeDict(TYPE.INT.union(TYPE.FLOAT), true)), 'mut Dict.<int> !<: mut Dict.<int | float>');
			});
		});

		describe('TypeSet', () => {
			it('is a subtype but not a supertype of `Object`.', () => {
				assert.ok(new TYPE.TypeSet(TYPE.INT).isSubtypeOf(TYPE.OBJ), 'Set.<int> <: Object');
				assert.ok(!TYPE.OBJ.isSubtypeOf(new TYPE.TypeSet(TYPE.INT)), 'Object !<: Set.<int>');
			});
			it('Invariance for immutable sets: `A == B --> Set.<A> <: Set.<B>`.', () => {
				assert.ok(!new TYPE.TypeSet(TYPE.INT).isSubtypeOf(new TYPE.TypeSet(TYPE.INT.union(TYPE.FLOAT))), 'Set.<int> !<: Set.<int | float>');
				assert.ok(!new TYPE.TypeSet(TYPE.INT.union(TYPE.FLOAT)).isSubtypeOf(new TYPE.TypeSet(TYPE.INT)), 'Set.<int | float> !<: Set.<int>');
			});
			it('Invariance for mutable sets: `A == B --> mut Set.<A> <: mut Set.<B>`.', () => {
				assert.ok(!new TYPE.TypeSet(TYPE.INT, true).isSubtypeOf(new TYPE.TypeSet(TYPE.INT.union(TYPE.FLOAT), true)), 'mut Set.<int> !<: mut Set.<int | float>');
			});
		});

		describe('TypeMap', () => {
			it('is a subtype but not a supertype of `Object`.', () => {
				assert.ok(new TYPE.TypeMap(TYPE.INT, TYPE.BOOL).isSubtypeOf(TYPE.OBJ), 'Map.<int, bool> <: Object');
				assert.ok(!TYPE.OBJ.isSubtypeOf(new TYPE.TypeMap(TYPE.INT, TYPE.BOOL)), 'Object !<: Map.<int, bool>');
			});
			it('Invariance for immutable maps’ keys: `A == C && --> Map.<A, B> <: Map.<C, B>`.', () => {
				assert.ok(!new TYPE.TypeMap(TYPE.INT, TYPE.BOOL).isSubtypeOf(new TYPE.TypeMap(TYPE.INT.union(TYPE.FLOAT), TYPE.BOOL)), 'Map.<int, bool> !<: Map.<int | float, bool>');
			});
			it('Covariance for immutable maps’ values: `B <: D --> Map.<A, B> <: Map.<A, D>`.', () => {
				assert.ok( new TYPE.TypeMap(TYPE.INT, TYPE.BOOL)                 .isSubtypeOf(new TYPE.TypeMap(TYPE.INT, TYPE.BOOL.union(TYPE.NULL))), 'Map.<int, bool>         <: Map.<int, bool | null>');
				assert.ok(!new TYPE.TypeMap(TYPE.INT, TYPE.BOOL.union(TYPE.NULL)).isSubtypeOf(new TYPE.TypeMap(TYPE.INT, TYPE.BOOL)),                  'Map.<int, bool | null> !<: Map.<int, bool>');
			});
			it('Invariance for mutable maps: `A == C && B == D --> mut Map.<A, B> <: mut Map.<C, D>`.', () => {
				assert.ok(!new TYPE.TypeMap(TYPE.INT, TYPE.BOOL, true).isSubtypeOf(new TYPE.TypeMap(TYPE.INT.union(TYPE.FLOAT), TYPE.BOOL.union(TYPE.NULL), true)), 'mut Map.<int, bool> !<: mut Map.<int | float, bool | null>');
			});
		});

		describe('TypeInterface', () => {
			it('returns `true` if the subtype contains at least the properties of the supertype.', () => {
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
					['diz', OBJ.Boolean.TRUETYPE],
					['qux', TYPE.INT.union(TYPE.FLOAT)],
				])).isSubtypeOf(t0));
			});
		});
	});


	describe('#equals', () => {
		it('bool == false | true', () => {
			assert.ok(TYPE.BOOL.equals(OBJ.Boolean.FALSETYPE.union(OBJ.Boolean.TRUETYPE)));
		});
		it.skip('built-in types do not equal unit types of their canonical values.', () => {
			assert.ok(!TYPE.BOOL  .equals(OBJ.Boolean.FALSETYPE), 'bool  != false');
			assert.ok(!TYPE.BOOL  .equals(OBJ.Boolean.TRUETYPE),  'bool  != true');
			assert.ok(!TYPE.INT   .equals(typeUnit(0n)),          'int   != 0');
			assert.ok(!TYPE.FLOAT .equals(typeUnit(0.0)),         'float != 0.0');
			assert.ok(!TYPE.STR   .equals(typeUnit('')),          'str   != ""');
		});
	});


	describe('#mutableOf', () => {
		const examples: readonly TYPE.Type[] = [
			new TYPE.TypeList(TYPE.BOOL),
			new TYPE.TypeDict(TYPE.BOOL),
			new TYPE.TypeSet(TYPE.NULL),
			new TYPE.TypeMap(TYPE.INT, TYPE.FLOAT),
		];
		it('mutable types are subtypes of their immutable counterparts.', () => {
			[
				...builtin_types,
				...examples,
			].forEach((t) => {
				assert.ok(t.mutableOf().isSubtypeOf(t), `mut ${ t } <: ${ t }`);
			});
		});
		it('non-constant mutable types are not equal to their immutable counterparts.', () => {
			examples.forEach((t) => {
				assert.ok(!t.mutableOf().equals(t), `mut ${ t } != ${ t }`);
			});
		});
		it('non-constant immutable types are not subtypes of their mutable counterparts.', () => {
			examples.forEach((t) => {
				assert.ok(!t.isSubtypeOf(t.mutableOf()), `${ t } !<: mut ${ t }`);
			});
		});
		context('disributes over binary operations.', () => {
			const types: TYPE.Type[] = [
				...builtin_types,
				...examples,
			];
			specify('mut (A - B) == mut A - mut B', () => {
				predicate2(types, (a, b) => {
					const difference: TYPE.Type = a.subtract(b).mutableOf();
					assert.ok(difference.equals(a.mutableOf().subtract(b.mutableOf())), `${ a }, ${ b }`);
					if (difference instanceof TYPE.TypeDifference) {
						assert.ok(!difference.isMutable, 'TypeDifference#isMutable === false');
					}
				});
			});
			specify('mut (A & B) == mut A & mut B', () => {
				predicate2(types, (a, b) => {
					const intersection: TYPE.Type = a.intersect(b).mutableOf();
					assert.ok(intersection.equals(a.mutableOf().intersect(b.mutableOf())), `${ a }, ${ b }`);
					if (intersection instanceof TYPE.TypeIntersection) {
						assert.ok(!intersection.isMutable, 'TypeIntersection#isMutable === false');
					}
				});
			});
			specify('mut (A | B) == mut A | mut B', () => {
				predicate2(types, (a, b) => {
					const union: TYPE.Type = a.union(b).mutableOf();
					assert.ok(union.equals(a.mutableOf().union(b.mutableOf())), `${ a }, ${ b }`);
					if (union instanceof TYPE.TypeUnion) {
						assert.ok(!union.isMutable, 'TypeUnion#isMutable === false');
					}
				});
			});
		});
	});



	describe('Combinable', () => {
		describe('#normalize', () => {
			const a: TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.INT]]));
			const b: TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x101n, TYPE.FLOAT]]));
			const c: TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x102n, TYPE.STR]]));

			describe('TypeIntersection', () => {
				it('factors out common union operands from intersection: `(A \| B)  & (A \| C) == A \| (B  & C)`.', () => {
					const actual:   TYPE.Type = a.union(b).intersect(a.union(c));
					const expected: TYPE.Type = a.union(b.intersect(c));
					assert.ok(actual.equals(expected), `(${ a } | ${ b }) & (${ a } | ${ c }) == ${ a } | ${ b } & ${ c }`);
					return assert.deepStrictEqual(actual, expected, `${ actual } == ${ expected }`);
				});
			});

			describe('TypeUnion', () => {
				it('factors out common intersection operands from union: `(A  & B) \| (A  & C) == A  & (B \| C)`.', () => {
					const actual:   TYPE.Type = a.intersect(b).union(a.intersect(c));
					const expected: TYPE.Type = a.intersect(b.union(c));
					assert.ok(actual.equals(expected), `${ a } & ${ b } | ${ a } & ${ c } == ${ a } & (${ b } | ${ c })`);
					return assert.deepStrictEqual(actual, expected);
				});
			});
		});


		describe('#denormalize', () => {
			const a: TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.INT]]));
			const b: TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x101n, TYPE.FLOAT]]));
			const c: TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x102n, TYPE.STR]]));

			describe('TypeIntersection', () => {
				it('distributes intersection operands over union: `(B \| C)  & A == (B  & A) \| (C  & A)`.', () => {
					const intersection: TYPE.Type = b.union(c).intersect(a);
					assert_instanceof(intersection, TYPE.TypeIntersection);

					const as_union: TYPE.Type = intersection.denormalize();
					const expected            = new TYPE.TypeUnion(b.intersect(a), c.intersect(a));
					assert.ok(as_union.equals(expected), `(${ b } | ${ c }) & ${ a } == ${ b } & ${ a } | ${ c } & ${ a }`);
					return assert.deepStrictEqual(as_union, expected);
				});
			});

			describe('TypeUnion', () => {
				it('distributes union operands over intersection: `(B  & C) \| A == (B \| A)  & (C \| A)`.', () => {
					const union: TYPE.Type = b.intersect(c).union(a);
					assert_instanceof(union, TYPE.TypeUnion);

					const as_intersection: TYPE.Type = union.denormalize();
					const expected                   = new TYPE.TypeIntersection(b.union(a), c.union(a));
					assert.ok(as_intersection.equals(expected), `${ b } & ${ c } | ${ a } == (${ b } | ${ a }) & (${ c } | ${ a })`);
					return assert.deepStrictEqual(as_intersection, expected);
				});
			});
		});


		describe('#combineTuplesOrRecords', () => {
			describe('TypeIntersection', () => {
				context('with tuple operands.', () => {
					it('takes the union of indices of constituent types.', () => {
						const actual: TYPE.Type = TYPE.TypeTuple.fromTypes([
							TYPE.OBJ,
							TYPE.NULL,
							TYPE.BOOL,
						]).intersect(TYPE.TypeTuple.fromTypes([
							TYPE.OBJ,
							TYPE.INT,
						]));
						assert_instanceof(actual, TYPE.TypeIntersection);
						assert.ok(actual.combineTuplesOrRecords().equals(TYPE.TypeTuple.fromTypes([
							TYPE.OBJ,
							TYPE.NULL.intersect(TYPE.INT),
							TYPE.BOOL,
						])), `
							[Object, null, bool] & [Object, int]
							==
							[Object, null & int, bool]
						`);
					});
					it('takes the conjunction of optionality.', () => {
						const actual: TYPE.Type = new TYPE.TypeTuple([
							{type: TYPE.OBJ,  optional: false},
							{type: TYPE.NULL, optional: true},
							{type: TYPE.BOOL, optional: true},
						]).intersect(new TYPE.TypeTuple([
							{type: TYPE.OBJ,   optional: false},
							{type: TYPE.INT,   optional: false},
							{type: TYPE.FLOAT, optional: true},
						]));
						assert_instanceof(actual, TYPE.TypeIntersection);
						assert.ok(actual.combineTuplesOrRecords().equals(new TYPE.TypeTuple([
							{type: TYPE.OBJ,                        optional: false},
							{type: TYPE.NULL.intersect(TYPE.INT),   optional: false},
							{type: TYPE.BOOL.intersect(TYPE.FLOAT), optional: true},
						])), `
							[Object, ?: null, ?: bool] & [Object, int, ?: float]
							==
							[Object, null & int, ?: bool & float]
						`);
					});
					it('all values assignable to combo type are assignable to intersection.', () => {
						const left: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([
							TYPE.BOOL,
							TYPE.INT,
						]);
						const right: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([
							OBJ.Boolean.TRUETYPE,
						]);

						const intersection: TYPE.Type = left.intersect(right);
						assert_instanceof(intersection, TYPE.TypeIntersection);

						const combined: TYPE.Type = intersection.combineTuplesOrRecords();
						assert.deepStrictEqual(combined, TYPE.TypeTuple.fromTypes([OBJ.Boolean.TRUETYPE, TYPE.INT]));

						const v = new OBJ.Tuple<OBJ.Boolean | OBJ.Integer>([OBJ.Boolean.TRUE, OBJ.Integer.UNIT]);

						assert.ok(combined.includes(v), `
							let x: [true, int] = [true, 1]; % ok
						`);
						assert.ok(intersection.includes(v), `
							let x: [bool, int] & [true] = [true, 1]; % ok
						`);
					});
				});
				context('with record operands.', () => {
					it('takes the union of properties of constituent types.', () => {
						const [foo, bar, qux, diz] = [0x100n, 0x101n, 0x102n, 0x103n];
						const actual: TYPE.Type = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
							[foo, TYPE.OBJ],
							[bar, TYPE.NULL],
							[qux, TYPE.BOOL],
						])).intersect(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
							[foo, TYPE.OBJ],
							[diz, TYPE.INT],
							[qux, TYPE.STR],
						])));
						assert_instanceof(actual, TYPE.TypeIntersection);
						assert.ok(actual.combineTuplesOrRecords().equals(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
							[foo, TYPE.OBJ],
							[bar, TYPE.NULL],
							[qux, TYPE.BOOL.intersect(TYPE.STR)],
							[diz, TYPE.INT],
						]))), `
							[foo: Object, bar: null, qux: bool] & [foo: Object, diz: int, qux: str]
							==
							[foo: Object, bar: null, qux: bool & str, diz: int]
						`);
					});
					it('takes the conjunction of optionality.', () => {
						const [foo, bar, qux, diz] = [0x100n, 0x101n, 0x102n, 0x103n];
						const actual: TYPE.Type = new TYPE.TypeRecord(new Map<bigint, TypeEntry>([
							[foo, {type: TYPE.OBJ,  optional: false}],
							[bar, {type: TYPE.NULL, optional: true}],
							[qux, {type: TYPE.BOOL, optional: true}],
						])).intersect(new TYPE.TypeRecord(new Map<bigint, TypeEntry>([
							[foo, {type: TYPE.OBJ, optional: false}],
							[diz, {type: TYPE.INT, optional: true}],
							[qux, {type: TYPE.STR, optional: false}],
						])));
						assert_instanceof(actual, TYPE.TypeIntersection);
						assert.ok(actual.combineTuplesOrRecords().equals(new TYPE.TypeRecord(new Map<bigint, TypeEntry>([
							[foo, {type: TYPE.OBJ,                      optional: false}],
							[bar, {type: TYPE.NULL,                     optional: true}],
							[qux, {type: TYPE.BOOL.intersect(TYPE.STR), optional: false}],
							[diz, {type: TYPE.INT,                      optional: true}],
						]))), `
							[foo: Object, bar?: null, qux?: bool] & [foo: Object, diz?: int, qux: str]
							==
							[foo: Object, bar?: null, qux: bool & str, diz?: int]
						`);
					});
					it('all values assignable to combo type are assignable to intersection.', () => {
						const left: TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
							[0x100n, TYPE.BOOL],
							[0x101n, typeUnit(42n)],
							[0x102n, TYPE.STR],
						]));
						const right: TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
							[0x103n, TYPE.STR],
							[0x100n, OBJ.Boolean.FALSETYPE],
							[0x101n, TYPE.INT],
						]));

						const intersection: TYPE.Type = left.intersect(right);
						assert_instanceof(intersection, TYPE.TypeIntersection);

						const combined: TYPE.Type = intersection.combineTuplesOrRecords();
						assert.deepStrictEqual(combined, TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
							[0x100n, OBJ.Boolean.FALSETYPE],
							[0x101n, typeUnit(42n)],
							[0x102n, TYPE.STR],
							[0x103n, TYPE.STR],
						])));

						const v = new OBJ.Record<OBJ.Boolean | OBJ.Integer | OBJ.String>(new Map<bigint, OBJ.Boolean | OBJ.Integer | OBJ.String>([
							[0x100n, OBJ.Boolean.FALSE],
							[0x101n, new OBJ.Integer(42n)],
							[0x102n, new OBJ.String('hello')],
							[0x103n, new OBJ.String('world')],
						]));

						assert.ok(combined.includes(v), `
							let x: [a: false, b: 42, c: str, d: str] = [a= false, b= 42, c= "hello", d= "world"]; % ok
						`);
						assert.ok(intersection.includes(v), `
							let x: [a: bool, b: 42, c: str] & [d: str, a: false, b: int] = [a= false, b= 42, c= "hello", d= "world"]; % ok
						`);
					});
				});
			});

			describe('TypeUnion', () => {
				context('with tuple operands.', () => {
					it('takes the intersection of indices of constituent types.', () => {
						const actual: TYPE.Type = TYPE.TypeTuple.fromTypes([
							TYPE.OBJ,
							TYPE.NULL,
							TYPE.BOOL,
						]).union(TYPE.TypeTuple.fromTypes([
							TYPE.OBJ,
							TYPE.INT,
						]));
						assert_instanceof(actual, TYPE.TypeUnion);
						assert.ok(actual.combineTuplesOrRecords().equals(TYPE.TypeTuple.fromTypes([
							TYPE.OBJ,
							TYPE.NULL.union(TYPE.INT),
						])), `
							[Object, null, bool] | [Object, int]
							==
							[Object, null | int]
						`);
					});
					it('takes the disjunction of optionality.', () => {
						const actual: TYPE.Type = new TYPE.TypeTuple([
							{type: TYPE.OBJ,  optional: false},
							{type: TYPE.NULL, optional: true},
							{type: TYPE.BOOL, optional: true},
						]).union(new TYPE.TypeTuple([
							{type: TYPE.OBJ,   optional: false},
							{type: TYPE.INT,   optional: false},
							{type: TYPE.FLOAT, optional: true},
						]));
						assert_instanceof(actual, TYPE.TypeUnion);
						assert.ok(actual.combineTuplesOrRecords().equals(new TYPE.TypeTuple([
							{type: TYPE.OBJ,                    optional: false},
							{type: TYPE.NULL.union(TYPE.INT),   optional: true},
							{type: TYPE.BOOL.union(TYPE.FLOAT), optional: true},
						])), `
							[Object, ?: null, ?: bool] | [Object, int, ?: float]
							==
							[Object, ?: null | int, ?: bool | float]
						`);
					});
					it('some value assignable to combo type might not be assignable to union.', () => {
						const left: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([
							TYPE.BOOL,
							TYPE.INT,
						]);
						const right: TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([
							TYPE.INT,
							TYPE.BOOL,
						]);

						const union: TYPE.Type = left.union(right);
						assert_instanceof(union, TYPE.TypeUnion);

						const combined: TYPE.Type = union.combineTuplesOrRecords();
						assert.deepStrictEqual(combined, TYPE.TypeTuple.fromTypes([TYPE.BOOL.union(TYPE.INT), TYPE.INT.union(TYPE.BOOL)]));

						const v = new OBJ.Tuple<OBJ.Boolean>([OBJ.Boolean.TRUE, OBJ.Boolean.TRUE]);

						assert.ok(combined.includes(v), `
							let x: [bool | int, int | bool] = [true, true]; % ok
						`);
						assert.ok(!union.includes(v), `
							let x: [bool, int] | [int, bool] = [true, true]; %> TypeError
						`);
					});
				});
				context('with record operands.', () => {
					it('takes the intersection of properties of constituent types.', () => {
						const [foo, bar, qux, diz] = [0x100n, 0x101n, 0x102n, 0x103n];
						const actual: TYPE.Type = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
							[foo, TYPE.OBJ],
							[bar, TYPE.NULL],
							[qux, TYPE.BOOL],
						])).union(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
							[foo, TYPE.OBJ],
							[diz, TYPE.INT],
							[qux, TYPE.STR],
						])));
						assert_instanceof(actual, TYPE.TypeUnion);
						assert.ok(actual.combineTuplesOrRecords().equals(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
							[foo, TYPE.OBJ],
							[qux, TYPE.BOOL.union(TYPE.STR)],
						]))), `
							[foo: Object, bar: null, qux: bool] | [foo: Object, diz: int, qux: str]
							==
							[foo: Object, qux: bool | str]
						`);
					});
					it('takes the disjunction of optionality.', () => {
						const [foo, bar, qux, diz] = [0x100n, 0x101n, 0x102n, 0x103n];
						const actual: TYPE.Type = new TYPE.TypeRecord(new Map<bigint, TypeEntry>([
							[foo, {type: TYPE.OBJ,  optional: false}],
							[bar, {type: TYPE.NULL, optional: true}],
							[qux, {type: TYPE.BOOL, optional: true}],
						])).union(new TYPE.TypeRecord(new Map<bigint, TypeEntry>([
							[foo, {type: TYPE.OBJ, optional: false}],
							[diz, {type: TYPE.INT, optional: true}],
							[qux, {type: TYPE.STR, optional: false}],
						])));
						assert_instanceof(actual, TYPE.TypeUnion);
						assert.ok(actual.combineTuplesOrRecords().equals(new TYPE.TypeRecord(new Map<bigint, TypeEntry>([
							[foo, {type: TYPE.OBJ,                  optional: false}],
							[qux, {type: TYPE.BOOL.union(TYPE.STR), optional: true}],
						]))), `
							[foo: Object, bar?: null, qux?: bool] | [foo: Object, diz?: int, qux: str]
							==
							[foo: Object, qux?: bool | str]
						`);
					});
					it('some value assignable to combo type might not be assignable to union.', () => {
						const left: TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
							[0x100n, TYPE.BOOL],
							[0x101n, TYPE.INT],
							[0x102n, TYPE.STR],
						]));
						const right: TYPE.TypeRecord = TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
							[0x103n, TYPE.STR],
							[0x100n, TYPE.INT],
							[0x101n, TYPE.BOOL],
						]));

						const union: TYPE.Type = left.union(right);
						assert_instanceof(union, TYPE.TypeUnion);

						const combined: TYPE.Type = union.combineTuplesOrRecords();
						assert.deepStrictEqual(combined, TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
							[0x100n, TYPE.BOOL.union(TYPE.INT)],
							[0x101n, TYPE.INT.union(TYPE.BOOL)],
						])));

						const v = new OBJ.Record<OBJ.Boolean>(new Map<bigint, OBJ.Boolean>([
							[0x100n, OBJ.Boolean.TRUE],
							[0x101n, OBJ.Boolean.TRUE],
						]));

						assert.ok(combined.includes(v), `
							let x: [a: bool | int, b: int | bool] = [a= true, b= true]; % ok
						`);
						assert.ok(!union.includes(v), `
							let x: [a: bool, b: int, c: str] | [d: str, a: int, b: bool] = [a= true, b= true]; %> TypeError
						`);
					});
				});
			});
		});
	});
	/* eslint-enable no-useless-escape */
});
