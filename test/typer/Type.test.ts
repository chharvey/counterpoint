import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	type TypeEntry,
	OBJ,
	TYPE,
	Builder,
} from '../../src/index.js';
import {
	typeUnitInt,
	typeUnitFloat,
	typeUnitStr,
} from '../helpers.js';



describe('Type', () => {
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
	const builtin_types: TYPE.Type[] = [
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


	it('false | true == bool', () => {
		assert.ok(OBJ.Boolean.FALSETYPE.union(OBJ.Boolean.TRUETYPE).equals(TYPE.BOOL));
	});


	describe('#includes', () => {
		it('uses `Object#identical` to compare values.', () => {
			function unionOfInts(ns: readonly bigint[]): TYPE.Type {
				return TYPE.Type.unionAll(ns.map((v) => typeUnitInt(v)));
			}
			function unionOfFloats(ns: readonly number[]): TYPE.Type {
				return TYPE.Type.unionAll(ns.map((v) => typeUnitFloat(v)));
			}
			const u1: TYPE.Type = unionOfFloats([4.2, 4.3, 4.4]);
			const u2: TYPE.Type = unionOfFloats([4.3, 4.4, 4.5]);
			const u3: TYPE.Type = unionOfInts([42n, 43n, 44n]);
			const u4: TYPE.Type = unionOfInts([43n, 44n, 45n]);
			assert.deepStrictEqual([
				u1,
				u2,
				u1.intersect(u2),
			].map((typ) => [...typ.values]), [
				[4.2, 4.3, 4.4],
				[4.3, 4.4, 4.5],
				[4.3, 4.4],
			].map((set) => set.map((n) => new OBJ.Float(n))), '(4.2 | 4.3 | 4.4) & (4.3 | 4.4 | 4.5) == (4.3 | 4.4)');
			assert.deepStrictEqual([
				u3,
				u4,
				u3.union(u4),
			].map((t) => [...t.values]), [
				[42n, 43n, 44n],
				[43n, 44n, 45n],
				[42n, 43n, 44n, 45n],
			].map((set) => set.map((n) => new OBJ.Integer(n))), '(42 | 43 | 44) | (43 | 44 | 45) == (42 | 43 | 44 | 45)');
		});
	});


	/* eslint-disable no-useless-escape --- escapes are copied from markdown file; easier for search-and-replace */
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
		it('extracts constituents of discriminated unions.', () => {
			assert.ok(
				TYPE.NULL.union(TYPE.BOOL).union(TYPE.INT)
					.intersect(TYPE.BOOL.union(TYPE.INT).union(TYPE.FLOAT))
					.equals(TYPE.BOOL.union(TYPE.INT)),
				`
					(null | bool | int) & (bool | int | float)
					==
					(bool | int)
				`,
			);
		});
		describe('TypeUnion', () => {
			it('distributes union operands over intersection: `(B \| C)  & A == (B  & A) \| (C  & A)`.', () => {
				const expr = TYPE.NULL.union(TYPE.INT).intersect(TYPE.VOID.union(TYPE.NULL).union(OBJ.Boolean.FALSETYPE));
				assert.ok(expr.equals(TYPE.NULL), '(null | int) & (void | null | false) == null');
				assert.deepStrictEqual(expr, TYPE.NULL);
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
		it('extracts constituents of discriminated unions.', () => {
			assert.ok(
				TYPE.NULL.union(TYPE.BOOL).union(TYPE.INT)
					.union(TYPE.BOOL.union(TYPE.INT).union(TYPE.FLOAT))
					.equals(TYPE.NULL.union(TYPE.BOOL).union(TYPE.INT).union(TYPE.FLOAT)),
				`
					(null | bool | int) | (bool | int | float)
					==
					(null | bool | int | float)
				`,
			);
		});
		describe('TypeIntersection', () => {
			it.skip('distributes intersection operands over union: `(B  & C) \| A == (B \| A)  & (C \| A)`.', () => {
				'TODO';
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
				   TYPE.NULL.union(TYPE.INT).isSubtypeOf(TYPE.NULL.union(TYPE.INT))
				&& !TYPE.NULL.union(TYPE.INT).isSubtypeOf(TYPE.NULL)
				&& !TYPE.NULL.union(TYPE.INT).isSubtypeOf(TYPE.INT),
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
				   TYPE.NULL.intersect(TYPE.INT).isSubtypeOf(TYPE.NULL.intersect(TYPE.INT))
				&& !TYPE.NULL.isSubtypeOf(TYPE.NULL.intersect(TYPE.INT))
				&& !TYPE.INT.isSubtypeOf(TYPE.NULL.intersect(TYPE.INT)),
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

		describe('TypeUnit', () => {
			it('unit Boolean types should be subtypes of `bool`.', () => {
				assert.ok(OBJ.Boolean.FALSETYPE.isSubtypeOf(TYPE.BOOL), 'Boolean.FALSETYPE');
				assert.ok(OBJ.Boolean.TRUETYPE .isSubtypeOf(TYPE.BOOL), 'Boolean.TRUETYPE');
			});
			it('unit Integer types should be subtypes of `int`.', () => {
				[42n, -42n, 0n, -0n].map((v) => typeUnitInt(v)).forEach((itype) => {
					assert.ok(itype.isSubtypeOf(TYPE.INT), `${ itype }`);
				});
			});
			it('unit Float types should be subtypes of `float`.', () => {
				[4.2, -4.2e-2, 0.0, -0.0].map((v) => typeUnitFloat(v)).forEach((ftype) => {
					assert.ok(ftype.isSubtypeOf(TYPE.FLOAT), `${ ftype }`);
				});
			});
			it('unit String types should be subtypes of `str`.', () => {
				['a4.2', 'b-4.2e-2', 'c0.0', 'd-0.0'].map((v) => typeUnitStr(v)).forEach((stype) => {
					assert.ok(stype.isSubtypeOf(TYPE.STR), `${ stype }`);
				});
			});
		});

		describe('Type{Tuple,Vect}', () => {
			new Map<string, typeof TYPE.TypeTuple | typeof TYPE.TypeVect>([
				['TypeTuple', TYPE.TypeTuple],
				['TypeVect', TYPE.TypeVect],
			]).forEach((cons, description) => {
				const delim: string = cons === TYPE.TypeVect ? '\\[' : '[';
				return describe(description, () => {
					it('is a subtype but not a supertype of `obj`.', () => {
						assert.ok(cons.fromTypes([
							TYPE.INT,
							TYPE.BOOL,
							TYPE.STR,
						]).isSubtypeOf(TYPE.OBJ), `${ delim }int, bool, str] <: obj;`);
						assert.ok(!TYPE.OBJ.isSubtypeOf(cons.fromTypes([
							TYPE.INT,
							TYPE.BOOL,
							TYPE.STR,
						])), `obj !<: ${ delim }int, bool, str]`);
					});
					it('matches per index.', () => {
						assert.ok(cons.fromTypes([
							TYPE.INT,
							TYPE.BOOL,
							TYPE.STR,
						]).isSubtypeOf(cons.fromTypes([
							TYPE.INT.union(TYPE.FLOAT),
							TYPE.BOOL.union(TYPE.NULL),
							TYPE.OBJ,
						])), `${ delim }int, bool, str] <: ${ delim }int | float, bool?, obj];`);
						assert.ok(!cons.fromTypes([
							TYPE.INT,
							TYPE.BOOL,
							TYPE.STR,
						]).isSubtypeOf(cons.fromTypes([
							TYPE.BOOL.union(TYPE.NULL),
							TYPE.OBJ,
							TYPE.INT.union(TYPE.FLOAT),
						])), `${ delim }int, bool, str] !<: ${ delim }bool?, obj, int | float];`);
					});
					it('returns false if assigned is smaller than assignee.', () => {
						assert.ok(!cons.fromTypes([
							TYPE.INT,
							TYPE.BOOL,
						]).isSubtypeOf(cons.fromTypes([
							TYPE.INT.union(TYPE.FLOAT),
							TYPE.BOOL.union(TYPE.NULL),
							TYPE.OBJ,
						])), `${ delim }int, bool] !<: ${ delim }int | float, bool?, obj];`);
					});
					it('skips rest if assigned is larger than assignee.', () => {
						assert.ok(cons.fromTypes([
							TYPE.INT,
							TYPE.BOOL,
							TYPE.STR,
						]).isSubtypeOf(cons.fromTypes([
							TYPE.INT.union(TYPE.FLOAT),
							TYPE.BOOL.union(TYPE.NULL),
						])), `${ delim }int, bool, str] <: ${ delim }int | float, bool?];`);
					});
					it('with optional entries, checks minimum count only.', () => {
						assert.ok(new cons([
							{type: TYPE.INT, optional: false},
							{type: TYPE.INT, optional: false},
							{type: TYPE.INT, optional: true},
							{type: TYPE.INT, optional: true},
						]).isSubtypeOf(new cons([
							{type: TYPE.INT, optional: false},
							{type: TYPE.INT, optional: true},
							{type: TYPE.INT, optional: true},
							{type: TYPE.INT, optional: true},
							{type: TYPE.INT, optional: true},
						])), `${ delim }int, int, ?:int, ?:int] <: ${ delim }int, ?:int, ?:int, ?:int, ?:int]`);
						assert.ok(!new cons([
							{type: TYPE.INT, optional: false},
							{type: TYPE.INT, optional: true},
							{type: TYPE.INT, optional: true},
							{type: TYPE.INT, optional: true},
							{type: TYPE.INT, optional: true},
						]).isSubtypeOf(new cons([
							{type: TYPE.INT, optional: false},
							{type: TYPE.INT, optional: false},
							{type: TYPE.INT, optional: true},
							{type: TYPE.INT, optional: true},
						])), `${ delim }int, ?:int, ?:int, ?:int, ?:int] !<: ${ delim }int, int, ?:int, ?:int]`);
					});
				});
			});
			it('Covariance for immutable tuples: `A <: B --> Tuple.<A> <: Tuple.<B>`.', () => {
				assert.ok(TYPE.TypeTuple.fromTypes([TYPE.INT, TYPE.FLOAT]).isSubtypeOf(TYPE.TypeTuple.fromTypes([TYPE.INT.union(TYPE.NULL), TYPE.FLOAT.union(TYPE.NULL)])), '[int, float] <: [int?, float?]');
			});
			it('Invariance for mutable tuples: `A == B --> mutable Tuple.<A> <: mutable Tuple.<B>`.', () => {
				assert.ok(!TYPE.TypeTuple.fromTypes([TYPE.INT, TYPE.FLOAT], true).isSubtypeOf(TYPE.TypeTuple.fromTypes([TYPE.INT.union(TYPE.NULL), TYPE.FLOAT.union(TYPE.NULL)], true)), 'mutable [int, float] !<: mutable [int?, float?]');
			});
			it('Covariance for vects: `A <: B --> Vect.<A> <: Vect.<B>`.', () => {
				assert.ok(TYPE.TypeVect.fromTypes([TYPE.INT, TYPE.FLOAT]).isSubtypeOf(TYPE.TypeVect.fromTypes([TYPE.INT.union(TYPE.NULL), TYPE.FLOAT.union(TYPE.NULL)])), '\\[int, float] <: \\[int?, float?]');
			});
			it('Tuple is never a subtype of Vect.', () => {
				assert.ok(!TYPE.TypeTuple.fromTypes([TYPE.INT], false) .isSubtypeOf(TYPE.TypeVect.fromTypes([TYPE.INT])),         '[int] !<: int\\[]');
				assert.ok(!TYPE.TypeTuple.fromTypes([TYPE.INT], true)  .isSubtypeOf(TYPE.TypeVect.fromTypes([TYPE.INT])), 'mutable [int] !<: int\\[]');
			});
			it('Vect is a subtype of non-mutable Tuple only.', () => {
				assert.ok( TYPE.TypeVect.fromTypes([TYPE.INT]).isSubtypeOf(TYPE.TypeTuple.fromTypes([TYPE.INT], false)), '\\[int]  <:         [int]');
				assert.ok(!TYPE.TypeVect.fromTypes([TYPE.INT]).isSubtypeOf(TYPE.TypeTuple.fromTypes([TYPE.INT], true)),  '\\[int] !<: mutable [int]');
			});
			it('Tuple is never a subtype of List.', () => {
				assert.ok(!TYPE.TypeTuple.fromTypes([TYPE.INT], false) .isSubtypeOf(new TYPE.TypeList(TYPE.INT, false)),         '[int] !<:         int[]');
				assert.ok(!TYPE.TypeTuple.fromTypes([TYPE.INT], true)  .isSubtypeOf(new TYPE.TypeList(TYPE.INT, false)), 'mutable [int] !<:         int[]');
				assert.ok(!TYPE.TypeTuple.fromTypes([TYPE.INT], true)  .isSubtypeOf(new TYPE.TypeList(TYPE.INT, true)),  'mutable [int] !<: mutable int[]');
			});
			it('Vect is never a subtype of List.', () => {
				assert.ok(!TYPE.TypeVect.fromTypes([TYPE.INT]).isSubtypeOf(new TYPE.TypeList(TYPE.INT, false)), '\\[int] !<: int[]');
			});
		});

		describe('Type{Record,Struct}', () => {
			new Map<string, typeof TYPE.TypeRecord | typeof TYPE.TypeStruct>([
				['TypeRecord', TYPE.TypeRecord],
				['TypeStruct', TYPE.TypeStruct],
			]).forEach((cons, description) => {
				const delim: string = cons === TYPE.TypeStruct ? '\\[' : '[';
				return describe(description, () => {
					it('is a subtype but not a supertype of `obj`.', () => {
						assert.ok(cons.fromTypes(new Map<bigint, TYPE.Type>([
							[0x100n, TYPE.INT],
							[0x101n, TYPE.BOOL],
							[0x102n, TYPE.STR],
						])).isSubtypeOf(TYPE.OBJ), `${ delim }x: int, y: bool, z: str] <: obj;`);
						assert.ok(!TYPE.OBJ.isSubtypeOf(cons.fromTypes(new Map<bigint, TYPE.Type>([
							[0x100n, TYPE.INT],
							[0x101n, TYPE.BOOL],
							[0x102n, TYPE.STR],
						]))), `obj !<: ${ delim }x: int, y: bool, z: str]`);
					});
					it('matches per key.', () => {
						assert.ok(cons.fromTypes(new Map<bigint, TYPE.Type>([
							[0x100n, TYPE.INT],
							[0x101n, TYPE.BOOL],
							[0x102n, TYPE.STR],
						])).isSubtypeOf(cons.fromTypes(new Map<bigint, TYPE.Type>([
							[0x101n, TYPE.BOOL.union(TYPE.NULL)],
							[0x102n, TYPE.OBJ],
							[0x100n, TYPE.INT.union(TYPE.FLOAT)],
						]))), `${ delim }x: int, y: bool, z: str] <: ${ delim }y: bool!, z: obj, x: int | float];`);
						assert.ok(!cons.fromTypes(new Map<bigint, TYPE.Type>([
							[0x100n, TYPE.INT],
							[0x101n, TYPE.BOOL],
							[0x102n, TYPE.STR],
						])).isSubtypeOf(cons.fromTypes(new Map<bigint, TYPE.Type>([
							[0x100n, TYPE.BOOL.union(TYPE.NULL)],
							[0x101n, TYPE.OBJ],
							[0x102n, TYPE.INT.union(TYPE.FLOAT)],
						]))), `${ delim }x: int, y: bool, z: str] !<: ${ delim }x: bool!, y: obj, z: int | float];`);
					});
					it('returns false if assigned is smaller than assignee.', () => {
						assert.ok(!cons.fromTypes(new Map<bigint, TYPE.Type>([
							[0x100n, TYPE.INT],
							[0x101n, TYPE.BOOL],
						])).isSubtypeOf(cons.fromTypes(new Map<bigint, TYPE.Type>([
							[0x101n, TYPE.BOOL.union(TYPE.NULL)],
							[0x102n, TYPE.OBJ],
							[0x100n, TYPE.INT.union(TYPE.FLOAT)],
						]))), `${ delim }x: int, y: bool] !<: ${ delim }y: bool!, z: obj, x: int | float];`);
					});
					it('skips rest if assigned is larger than assignee.', () => {
						assert.ok(cons.fromTypes(new Map<bigint, TYPE.Type>([
							[0x100n, TYPE.INT],
							[0x101n, TYPE.BOOL],
							[0x102n, TYPE.STR],
						])).isSubtypeOf(cons.fromTypes(new Map<bigint, TYPE.Type>([
							[0x101n, TYPE.BOOL.union(TYPE.NULL)],
							[0x100n, TYPE.INT.union(TYPE.FLOAT)],
						]))), `${ delim }x: int, y: bool, z: str] <: ${ delim }y: bool!, x: int | float];`);
					});
					it('returns false if assignee contains keys that assigned does not.', () => {
						assert.ok(!cons.fromTypes(new Map<bigint, TYPE.Type>([
							[0x100n, TYPE.INT],
							[0x101n, TYPE.BOOL],
							[0x102n, TYPE.STR],
						])).isSubtypeOf(cons.fromTypes(new Map<bigint, TYPE.Type>([
							[0x101n, TYPE.BOOL.union(TYPE.NULL)],
							[0x102n, TYPE.OBJ],
							[0x103n, TYPE.INT.union(TYPE.FLOAT)],
						]))), `${ delim }x: int, y: bool, z: str] !<: ${ delim }y: bool!, z: obj, w: int | float]`);
					});
					it('optional entries are not assignable to required entries.', () => {
						assert.ok(new cons(new Map<bigint, TypeEntry>([
							[0x100n, {type: TYPE.STR,  optional: false}],
							[0x101n, {type: TYPE.INT,  optional: true}],
							[0x102n, {type: TYPE.BOOL, optional: false}],
						])).isSubtypeOf(new cons(new Map<bigint, TypeEntry>([
							[0x100n, {type: TYPE.STR,  optional: true}],
							[0x101n, {type: TYPE.INT,  optional: true}],
							[0x102n, {type: TYPE.BOOL, optional: false}],
						]))), `${ delim }a: str, b?: int, c: bool] <: ${ delim }a?: str, b?: int, c: bool]`);
						assert.ok(!new cons(new Map<bigint, TypeEntry>([
							[0x100n, {type: TYPE.STR,  optional: false}],
							[0x101n, {type: TYPE.INT,  optional: true}],
							[0x102n, {type: TYPE.BOOL, optional: false}],
						])).isSubtypeOf(new cons(new Map<bigint, TypeEntry>([
							[0x100n, {type: TYPE.STR,  optional: true}],
							[0x101n, {type: TYPE.INT,  optional: false}],
							[0x102n, {type: TYPE.BOOL, optional: false}],
						]))), `${ delim }a: str, b?: int, c: bool] !<: ${ delim }a?: str, b: int, c: bool]`);
					});
				});
			});
			it('Covariance for immutable records: `A <: B --> Record.<A> <: Record.<B>`.', () => {
				assert.ok(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.FLOAT],
				])).isSubtypeOf(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT.union(TYPE.NULL)],
					[0x101n, TYPE.FLOAT.union(TYPE.NULL)],
				]))), '[a: int, b: float] <: [a: int?, b: float?]');
			});
			it('Invariance for mutable records: `A == B --> mutable Record.<A> <: mutable Record.<B>`.', () => {
				assert.ok(!TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.FLOAT],
				]), true).isSubtypeOf(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT.union(TYPE.NULL)],
					[0x101n, TYPE.FLOAT.union(TYPE.NULL)],
				]), true)), 'mutable [a: int, b: float] !<: mutable [a: int?, b: float?]');
			});
			it('Covariance for structs: `A <: B --> Struct.<A> <: Struct.<B>`.', () => {
				assert.ok(TYPE.TypeStruct.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.FLOAT],
				])).isSubtypeOf(TYPE.TypeStruct.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT.union(TYPE.NULL)],
					[0x101n, TYPE.FLOAT.union(TYPE.NULL)],
				]))), '\\[a: int, b: float] <: \\[a: int?, b: float?]');
			});
			it('Record is never a subtype of Struct.', () => {
				const arg = new Map<bigint, TYPE.Type>([[0x100n, TYPE.INT]]);
				assert.ok(!TYPE.TypeRecord.fromTypes(arg, false) .isSubtypeOf(TYPE.TypeStruct.fromTypes(arg)),         '[a: int] !<: \\[a: int]');
				assert.ok(!TYPE.TypeRecord.fromTypes(arg, true)  .isSubtypeOf(TYPE.TypeStruct.fromTypes(arg)), 'mutable [a: int] !<: \\[a: int]');
			});
			it('Struct is a subtype of non-mutable Record only.', () => {
				const arg = new Map<bigint, TYPE.Type>([[0x100n, TYPE.INT]]);
				assert.ok( TYPE.TypeStruct.fromTypes(arg).isSubtypeOf(TYPE.TypeRecord.fromTypes(arg, false)), '\\[a: int]  <:         [a: int]');
				assert.ok(!TYPE.TypeStruct.fromTypes(arg).isSubtypeOf(TYPE.TypeRecord.fromTypes(arg, true)),  '\\[a: int] !<: mutable [a: int]');
			});
			it('Record is never a subtype of Dict.', () => {
				const arg = new Map<bigint, TYPE.Type>([[0x100n, TYPE.INT]]);
				assert.ok(!TYPE.TypeRecord.fromTypes(arg, false).isSubtypeOf(new TYPE.TypeDict(TYPE.INT, false)),         '[a: int] !<:         [: int]');
				assert.ok(!TYPE.TypeRecord.fromTypes(arg, true) .isSubtypeOf(new TYPE.TypeDict(TYPE.INT, false)), 'mutable [a: int] !<:         [: int]');
				assert.ok(!TYPE.TypeRecord.fromTypes(arg, true) .isSubtypeOf(new TYPE.TypeDict(TYPE.INT, true)),  'mutable [a: int] !<: mutable [: int]');
			});
			it('Struct is never a subtype of Dict.', () => {
				assert.ok(!TYPE.TypeStruct.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.INT]])).isSubtypeOf(new TYPE.TypeDict(TYPE.INT, false)), '\\[a: int] !<: [: int]');
			});
		});

		describe('TypeList', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(new TYPE.TypeList(TYPE.INT.union(TYPE.BOOL)).isSubtypeOf(TYPE.OBJ), 'List.<int | bool> <: obj;');
				assert.ok(!TYPE.OBJ.isSubtypeOf(new TYPE.TypeList(TYPE.INT.union(TYPE.BOOL))), 'obj !<: List.<int | bool>');
			});
			it('Covariance for immutable lists: `A <: B --> List.<A> <: List.<B>`.', () => {
				assert.ok(new TYPE.TypeList(TYPE.INT).isSubtypeOf(new TYPE.TypeList(TYPE.INT.union(TYPE.FLOAT))), 'List.<int> <: List.<int | float>');
				assert.ok(!new TYPE.TypeList(TYPE.INT.union(TYPE.FLOAT)).isSubtypeOf(new TYPE.TypeList(TYPE.INT)), 'List.<int | float> !<: List.<int>');
			});
			it('Invariance for mutable lists: `A == B --> mutable List.<A> <: mutable List.<B>`.', () => {
				assert.ok(!new TYPE.TypeList(TYPE.INT, true).isSubtypeOf(new TYPE.TypeList(TYPE.INT.union(TYPE.FLOAT), true)), 'mutable List.<int> !<: mutable List.<int | float>');
			});
		});

		describe('TypeDict', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(new TYPE.TypeDict(TYPE.INT.union(TYPE.BOOL)).isSubtypeOf(TYPE.OBJ), 'Dict.<int | bool> <: obj;');
				assert.ok(!TYPE.OBJ.isSubtypeOf(new TYPE.TypeDict(TYPE.INT.union(TYPE.BOOL))), 'obj !<: Dict.<int | bool>');
			});
			it('Covariance for immutable dicts: `A <: B --> Dict.<A> <: Dict.<B>`.', () => {
				assert.ok(new TYPE.TypeDict(TYPE.INT).isSubtypeOf(new TYPE.TypeDict(TYPE.INT.union(TYPE.FLOAT))), 'Dict.<int> <: Dict.<int | float>');
				assert.ok(!new TYPE.TypeDict(TYPE.INT.union(TYPE.FLOAT)).isSubtypeOf(new TYPE.TypeDict(TYPE.INT)), 'Dict.<int | float> !<: Dict.<int>');
			});
			it('Invariance for mutable dicts: `A == B --> mutable Dict.<A> <: mutable Dict.<B>`.', () => {
				assert.ok(!new TYPE.TypeDict(TYPE.INT, true).isSubtypeOf(new TYPE.TypeDict(TYPE.INT.union(TYPE.FLOAT), true)), 'mutable Dict.<int> !<: mutable Dict.<int | float>');
			});
		});

		describe('TypeSet', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(new TYPE.TypeSet(TYPE.INT).isSubtypeOf(TYPE.OBJ), 'Set.<int> <: obj');
				assert.ok(!TYPE.OBJ.isSubtypeOf(new TYPE.TypeSet(TYPE.INT)), 'obj !<: Set.<int>');
			});
			it('Invariance for immutable sets: `A == B --> Set.<A> <: Set.<B>`.', () => {
				assert.ok(!new TYPE.TypeSet(TYPE.INT).isSubtypeOf(new TYPE.TypeSet(TYPE.INT.union(TYPE.FLOAT))), 'Set.<int> !<: Set.<int | float>');
				assert.ok(!new TYPE.TypeSet(TYPE.INT.union(TYPE.FLOAT)).isSubtypeOf(new TYPE.TypeSet(TYPE.INT)), 'Set.<int | float> !<: Set.<int>');
			});
			it('Invariance for mutable sets: `A == B --> mutable Set.<A> <: mutable Set.<B>`.', () => {
				assert.ok(!new TYPE.TypeSet(TYPE.INT, true).isSubtypeOf(new TYPE.TypeSet(TYPE.INT.union(TYPE.FLOAT), true)), 'mutable Set.<int> !<: mutable Set.<int | float>');
			});
		});

		describe('TypeMap', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(new TYPE.TypeMap(TYPE.INT, TYPE.BOOL).isSubtypeOf(TYPE.OBJ), 'Map.<int, bool> <: obj');
				assert.ok(!TYPE.OBJ.isSubtypeOf(new TYPE.TypeMap(TYPE.INT, TYPE.BOOL)), 'obj !<: Map.<int, bool>');
			});
			it('Invariance for immutable maps’ keys: `A == C && --> Map.<A, B> <: Map.<C, B>`.', () => {
				assert.ok(!new TYPE.TypeMap(TYPE.INT, TYPE.BOOL).isSubtypeOf(new TYPE.TypeMap(TYPE.INT.union(TYPE.FLOAT), TYPE.BOOL)), 'Map.<int, bool> !<: Map.<int | float, bool>');
			});
			it('Covariance for immutable maps’ values: `B <: D --> Map.<A, B> <: Map.<A, D>`.', () => {
				assert.ok( new TYPE.TypeMap(TYPE.INT, TYPE.BOOL)                 .isSubtypeOf(new TYPE.TypeMap(TYPE.INT, TYPE.BOOL.union(TYPE.NULL))), 'Map.<int, bool>         <: Map.<int, bool | null>');
				assert.ok(!new TYPE.TypeMap(TYPE.INT, TYPE.BOOL.union(TYPE.NULL)).isSubtypeOf(new TYPE.TypeMap(TYPE.INT, TYPE.BOOL)),                  'Map.<int, bool | null> !<: Map.<int, bool>');
			});
			it('Invariance for mutable maps: `A == C && B == D --> mutable Map.<A, B> <: mutable Map.<C, D>`.', () => {
				assert.ok(!new TYPE.TypeMap(TYPE.INT, TYPE.BOOL, true).isSubtypeOf(new TYPE.TypeMap(TYPE.INT.union(TYPE.FLOAT), TYPE.BOOL.union(TYPE.NULL), true)), 'mutable Map.<int, bool> !<: mutable Map.<int | float, bool | null>');
			});
		});

		describe('TypeInterface', () => {
			it('returns `true` if the subtype contains at least the properties of the supertype.', () => {
				assert.ok(!t0.isSubtypeOf(t1));
				assert.ok(!t1.isSubtypeOf(t0));
				assert.ok(new TYPE.TypeInterface(new Map<string, TYPE.Type>([
					['foo', TYPE.STR],
					['bar', TYPE.NULL],
					['diz', TYPE.BOOL],
					['qux', TYPE.INT.union(TYPE.FLOAT)],
				])).isSubtypeOf(t0));
			});
		});
	});
	/* eslint-enable no-useless-escape */


	describe('#mutableOf', () => {
		it('mutable types are subtypes of their immutable counterparts.', () => {
			[
				...builtin_types,
				TYPE.TypeTuple.fromTypes([
					TYPE.INT,
					TYPE.FLOAT,
					TYPE.STR,
				]),
				TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.FLOAT],
					[0x102n, TYPE.STR],
				])),
				new TYPE.TypeList(TYPE.BOOL),
				new TYPE.TypeDict(TYPE.BOOL),
				new TYPE.TypeSet(TYPE.NULL),
				new TYPE.TypeMap(TYPE.INT, TYPE.FLOAT),
			].forEach((t) => {
				assert.ok(t.mutableOf().isSubtypeOf(t), `mutable ${ t } <: ${ t }`);
			});
		});
		it('non-constant mutable types are not equal to their immutable counterparts.', () => {
			[
				TYPE.TypeTuple.fromTypes([
					TYPE.INT,
					TYPE.FLOAT,
					TYPE.STR,
				]),
				TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.FLOAT],
					[0x102n, TYPE.STR],
				])),
				new TYPE.TypeList(TYPE.BOOL),
				new TYPE.TypeDict(TYPE.BOOL),
				new TYPE.TypeSet(TYPE.NULL),
				new TYPE.TypeMap(TYPE.INT, TYPE.FLOAT),
			].forEach((t) => {
				assert.ok(!t.mutableOf().equals(t), `mutable ${ t } != ${ t }`);
			});
		});
		it('non-constant immutable types are not subtypes of their mutable counterparts.', () => {
			[
				TYPE.TypeTuple.fromTypes([
					TYPE.INT,
					TYPE.FLOAT,
					TYPE.STR,
				]),
				TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.FLOAT],
					[0x102n, TYPE.STR],
				])),
				new TYPE.TypeList(TYPE.BOOL),
				new TYPE.TypeDict(TYPE.BOOL),
				new TYPE.TypeSet(TYPE.NULL),
				new TYPE.TypeMap(TYPE.INT, TYPE.FLOAT),
			].forEach((t) => {
				assert.ok(!t.isSubtypeOf(t.mutableOf()), `${ t } !<: mutable ${ t }`);
			});
		});
		context('disributes over binary operations.', () => {
			const types: TYPE.Type[] = [
				TYPE.NEVER,
				TYPE.UNKNOWN,
				TYPE.VOID,
				TYPE.OBJ,
				TYPE.NULL,
				TYPE.BOOL,
				TYPE.INT,
				TYPE.FLOAT,
				TYPE.STR,
				TYPE.TypeTuple.fromTypes([
					TYPE.INT,
					TYPE.FLOAT,
					TYPE.STR,
				]),
				TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.FLOAT],
					[0x102n, TYPE.STR],
				])),
				new TYPE.TypeList(TYPE.BOOL),
				new TYPE.TypeDict(TYPE.BOOL),
				new TYPE.TypeSet(TYPE.NULL),
				new TYPE.TypeMap(TYPE.INT, TYPE.FLOAT),
			];
			specify('mutable (A - B) == mutable A - mutable B', () => {
				predicate2(types, (a, b) => {
					const difference: TYPE.Type = a.subtract(b).mutableOf();
					assert.ok(difference.equals(a.mutableOf().subtract(b.mutableOf())), `${ a }, ${ b }`);
					if (difference instanceof TYPE.TypeDifference) {
						assert.ok(!difference.isMutable, 'TypeDifference#isMutable === false');
					}
				});
			});
			specify('mutable (A & B) == mutable A & mutable B', () => {
				predicate2(types, (a, b) => {
					const intersection: TYPE.Type = a.intersect(b).mutableOf();
					assert.ok(intersection.equals(a.mutableOf().intersect(b.mutableOf())), `${ a }, ${ b }`);
					if (intersection instanceof TYPE.TypeIntersection) {
						assert.ok(!intersection.isMutable, 'TypeIntersection#isMutable === false');
					}
				});
			});
			specify('mutable (A | B) == mutable A | mutable B', () => {
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


	describe('#binType', () => {
		it('returns a binaryen type for simple types.', () => {
			const tests = new Map<TYPE.Type, binaryen.Type>([
				[TYPE.NEVER, binaryen.unreachable],
				[TYPE.VOID,  binaryen.none],
				[TYPE.NULL,  binaryen.i32],
				[TYPE.BOOL,  binaryen.i32],
				[TYPE.INT,   binaryen.i32],
				[TYPE.FLOAT, binaryen.f64],
			]);
			return assert.deepStrictEqual([...tests.keys()].map((t) => t.binType()), [...tests.values()]);
		});
		it('returns `Either<Left, Right>` monads for unions.', () => {
			const tests = new Map<TYPE.Type, binaryen.Type>([
				[TYPE.NULL.union(TYPE.BOOL),  Builder.createBinTypeEither(binaryen.i32, binaryen.i32)],
				[TYPE.BOOL.union(TYPE.INT),   Builder.createBinTypeEither(binaryen.i32, binaryen.i32)],
				[TYPE.NULL.union(TYPE.INT),   Builder.createBinTypeEither(binaryen.i32, binaryen.i32)],
				[TYPE.VOID.union(TYPE.NULL),  Builder.createBinTypeEither(binaryen.i32, binaryen.i32)],
				[TYPE.VOID.union(TYPE.BOOL),  Builder.createBinTypeEither(binaryen.i32, binaryen.i32)],
				[TYPE.VOID.union(TYPE.INT),   Builder.createBinTypeEither(binaryen.i32, binaryen.i32)],
				[TYPE.VOID.union(TYPE.FLOAT), Builder.createBinTypeEither(binaryen.f64, binaryen.f64)],
				[TYPE.NULL.union(TYPE.FLOAT), Builder.createBinTypeEither(binaryen.i32, binaryen.f64)],
				[TYPE.BOOL.union(TYPE.FLOAT), Builder.createBinTypeEither(binaryen.i32, binaryen.f64)],
				[TYPE.INT .union(TYPE.FLOAT), Builder.createBinTypeEither(binaryen.i32, binaryen.f64)],
			]);
			return assert.deepStrictEqual([...tests.keys()].map((t) => t.binType()), [...tests.values()]);
		});
	});


	describe('TypeIntersection', () => {
		describe('#combineTuplesOrRecords', () => {
			context('with tuple operands.', () => {
				it('takes the union of indices of constituent types.', () => {
					assert.ok(TYPE.TypeTuple.fromTypes([
						TYPE.OBJ,
						TYPE.NULL,
						TYPE.BOOL,
					]).intersectWithTuple(TYPE.TypeTuple.fromTypes([
						TYPE.OBJ,
						TYPE.INT,
					])).equals(TYPE.TypeTuple.fromTypes([
						TYPE.OBJ,
						TYPE.NULL.intersect(TYPE.INT),
						TYPE.BOOL,
					])), `
						[obj, null, bool] & [obj, int]
						==
						[obj, null & int, bool]
					`);
				});
				it('takes the conjunction of optionality.', () => {
					assert.ok(new TYPE.TypeTuple([
						{type: TYPE.OBJ,  optional: false},
						{type: TYPE.NULL, optional: true},
						{type: TYPE.BOOL, optional: true},
					]).intersectWithTuple(new TYPE.TypeTuple([
						{type: TYPE.OBJ,   optional: false},
						{type: TYPE.INT,   optional: false},
						{type: TYPE.FLOAT, optional: true},
					])).equals(new TYPE.TypeTuple([
						{type: TYPE.OBJ,                        optional: false},
						{type: TYPE.NULL.intersect(TYPE.INT),   optional: false},
						{type: TYPE.BOOL.intersect(TYPE.FLOAT), optional: true},
					])), `
						[obj, ?: null, ?: bool] & [obj, int, ?: float]
						==
						[obj, null & int, ?: bool & float]
					`);
				});
			});
			context('with record operands.', () => {
				it('takes the union of properties of constituent types.', () => {
					const [foo, bar, qux, diz] = [0x100n, 0x101n, 0x102n, 0x103n];
					assert.ok(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
						[foo, TYPE.OBJ],
						[bar, TYPE.NULL],
						[qux, TYPE.BOOL],
					])).intersectWithRecord(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
						[foo, TYPE.OBJ],
						[diz, TYPE.INT],
						[qux, TYPE.STR],
					]))).equals(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
						[foo, TYPE.OBJ],
						[bar, TYPE.NULL],
						[qux, TYPE.BOOL.intersect(TYPE.STR)],
						[diz, TYPE.INT],
					]))), `
						[foo: obj, bar: null, qux: bool] & [foo: obj, diz: int, qux: str]
						==
						[foo: obj, bar: null, qux: bool & str, diz: int]
					`);
				});
				it('takes the conjunction of optionality.', () => {
					const [foo, bar, qux, diz] = [0x100n, 0x101n, 0x102n, 0x103n];
					assert.ok(new TYPE.TypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: TYPE.OBJ,  optional: false}],
						[bar, {type: TYPE.NULL, optional: true}],
						[qux, {type: TYPE.BOOL, optional: true}],
					])).intersectWithRecord(new TYPE.TypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: TYPE.OBJ, optional: false}],
						[diz, {type: TYPE.INT, optional: true}],
						[qux, {type: TYPE.STR, optional: false}],
					]))).equals(new TYPE.TypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: TYPE.OBJ,                      optional: false}],
						[bar, {type: TYPE.NULL,                     optional: true}],
						[qux, {type: TYPE.BOOL.intersect(TYPE.STR), optional: false}],
						[diz, {type: TYPE.INT,                      optional: true}],
					]))), `
						[foo: obj, bar?: null, qux?: bool] & [foo: obj, diz?: int, qux: str]
						==
						[foo: obj, bar?: null, qux: bool & str, diz?: int]
					`);
				});
			});
		});
	});


	describe('TypeUnion', () => {
		describe('#combineTuplesOrRecords', () => {
			context('with tuple operands.', () => {
				it('takes the intersection of indices of constituent types.', () => {
					assert.ok(TYPE.TypeTuple.fromTypes([
						TYPE.OBJ,
						TYPE.NULL,
						TYPE.BOOL,
					]).unionWithTuple(TYPE.TypeTuple.fromTypes([
						TYPE.OBJ,
						TYPE.INT,
					])).equals(TYPE.TypeTuple.fromTypes([
						TYPE.OBJ,
						TYPE.NULL.union(TYPE.INT),
					])), `
						[obj, null, bool] | [obj, int]
						==
						[obj, null | int]
					`);
				});
				it('takes the disjunction of optionality.', () => {
					assert.ok(new TYPE.TypeTuple([
						{type: TYPE.OBJ,  optional: false},
						{type: TYPE.NULL, optional: true},
						{type: TYPE.BOOL, optional: true},
					]).unionWithTuple(new TYPE.TypeTuple([
						{type: TYPE.OBJ,   optional: false},
						{type: TYPE.INT,   optional: false},
						{type: TYPE.FLOAT, optional: true},
					])).equals(new TYPE.TypeTuple([
						{type: TYPE.OBJ,                    optional: false},
						{type: TYPE.NULL.union(TYPE.INT),   optional: true},
						{type: TYPE.BOOL.union(TYPE.FLOAT), optional: true},
					])), `
						[obj, ?: null, ?: bool] | [obj, int, ?: float]
						==
						[obj, ?: null | int, ?: bool | float]
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
					assert.ok(union instanceof TYPE.TypeUnion);
					const v = new OBJ.Tuple<OBJ.Boolean>([OBJ.Boolean.TRUE, OBJ.Boolean.TRUE]);
					assert.ok(union.combineTuplesOrRecords().includes(v), `
						let x: [bool | int, int | bool] = [true, true]; % ok
					`);
					assert.ok(!left.union(right).includes(v), `
						let x: [bool, int] | [int, bool] = [true, true]; %> TypeError
					`);
				});
			});
			context('with record operands.', () => {
				it('takes the intersection of properties of constituent types.', () => {
					const [foo, bar, qux, diz] = [0x100n, 0x101n, 0x102n, 0x103n];
					assert.ok(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
						[foo, TYPE.OBJ],
						[bar, TYPE.NULL],
						[qux, TYPE.BOOL],
					])).unionWithRecord(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
						[foo, TYPE.OBJ],
						[diz, TYPE.INT],
						[qux, TYPE.STR],
					]))).equals(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
						[foo, TYPE.OBJ],
						[qux, TYPE.BOOL.union(TYPE.STR)],
					]))), `
						[foo: obj, bar: null, qux: bool] | [foo: obj, diz: int, qux: str]
						==
						[foo: obj, qux: bool | str]
					`);
				});
				it('takes the disjunction of optionality.', () => {
					const [foo, bar, qux, diz] = [0x100n, 0x101n, 0x102n, 0x103n];
					assert.ok(new TYPE.TypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: TYPE.OBJ,  optional: false}],
						[bar, {type: TYPE.NULL, optional: true}],
						[qux, {type: TYPE.BOOL, optional: true}],
					])).unionWithRecord(new TYPE.TypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: TYPE.OBJ, optional: false}],
						[diz, {type: TYPE.INT, optional: true}],
						[qux, {type: TYPE.STR, optional: false}],
					]))).equals(new TYPE.TypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: TYPE.OBJ,                  optional: false}],
						[qux, {type: TYPE.BOOL.union(TYPE.STR), optional: true}],
					]))), `
						[foo: obj, bar?: null, qux?: bool] | [foo: obj, diz?: int, qux: str]
						==
						[foo: obj, qux?: bool | str]
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
					assert.ok(union instanceof TYPE.TypeUnion);
					const v = new OBJ.Record<OBJ.Boolean>(new Map<bigint, OBJ.Boolean>([
						[0x100n, OBJ.Boolean.TRUE],
						[0x101n, OBJ.Boolean.TRUE],
					]));
					assert.ok(union.combineTuplesOrRecords().includes(v), `
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
