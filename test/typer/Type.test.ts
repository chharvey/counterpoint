import * as assert from 'assert'
import {
	TypeEntry,
	TYPE,
	OBJ,
} from '../../src/typer/index.js';
import {
	typeUnitInt,
	typeUnitFloat,
	typeUnitStr,
} from '../helpers.js';



describe('Type', () => {
	function predicate2<T>(array: T[], p: (a: T, b: T) => void): void {
		array.forEach((a) => {
			array.forEach((b) => {
				p(a, b)
			})
		})
	}
	function predicate3<T>(array: T[], p: (a: T, b: T, c: T) => void): void {
		array.forEach((a) => {
			array.forEach((b) => {
				array.forEach((c) => {
					p(a, b, c)
				})
			})
		})
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
	]
	const t0: TYPE.TypeInterface = new TYPE.TypeInterface(new Map<string, TYPE.Type>([
		['foo', TYPE.OBJ],
		['bar', TYPE.NULL],
		['diz', TYPE.BOOL],
	]))
	const t1: TYPE.TypeInterface = new TYPE.TypeInterface(new Map<string, TYPE.Type>([
		['foo', TYPE.OBJ],
		['qux', TYPE.INT.union(TYPE.FLOAT)],
		['diz', TYPE.STR],
	]))


	describe('#includes', () => {
		it('uses `Object#identical` to compare values.', () => {
			function unionOfInts(ns: bigint[]): TYPE.Type {
				return TYPE.Type.unionAll(ns.map((v) => typeUnitInt(v)));
			}
			function unionOfFloats(ns: number[]): TYPE.Type {
				return TYPE.Type.unionAll(ns.map((v) => typeUnitFloat(v)));
			}
			const t1: TYPE.Type = unionOfFloats([4.2, 4.3, 4.4]);
			const t2: TYPE.Type = unionOfFloats([4.3, 4.4, 4.5]);
			const t3: TYPE.Type = unionOfInts([42n, 43n, 44n]);
			const t4: TYPE.Type = unionOfInts([43n, 44n, 45n]);
			assert.deepStrictEqual([
				t1,
				t2,
				t1.intersect(t2),
			].map((typ) => [...typ.values]), [
				[4.2, 4.3, 4.4],
				[4.3, 4.4, 4.5],
				[4.3, 4.4],
			].map((set) => set.map((n) => new OBJ.Float(n))), '(4.2 | 4.3 | 4.4) & (4.3 | 4.4 | 4.5) == (4.3 | 4.4)');
			assert.deepStrictEqual([
				t3,
				t4,
				t3.union(t4),
			].map((t) => [...t.values]), [
				[42n, 43n, 44n],
				[43n, 44n, 45n],
				[42n, 43n, 44n, 45n],
			].map((set) => set.map((n) => new OBJ.Integer(n))), '(42 | 43 | 44) | (43 | 44 | 45) == (42 | 43 | 44 | 45)');
		});
	});


	describe('#intersect', () => {
		it('1-5 | `T  & never   == never`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.intersect(TYPE.NEVER).equals(TYPE.NEVER), `${ t }`);
			})
		})
		it('1-6 | `T  & unknown == T`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.intersect(TYPE.UNKNOWN).equals(t), `${ t }`);
			})
		})
		it('2-1 | `A  & B == B  & A`', () => {
			predicate2(builtin_types, (a, b) => {
				assert.ok(a.intersect(b).equals(b.intersect(a)), `${ a }, ${ b }`)
			})
		})
		it('2-3 | `(A  & B)  & C == A  & (B  & C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.intersect(b).intersect(c).equals(a.intersect(b.intersect(c))), `${ a }, ${ b }, ${ c }`)
			})
		})
		it('2-5 | `A  & (B \| C) == (A  & B) \| (A  & C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.intersect(b.union(c)).equals(a.intersect(b).union(a.intersect(c))), `${ a }, ${ b }, ${ c }`)
			})
		})
		it('extracts constituents of discriminated unions.', () => {
			assert.ok(TYPE.NULL.union(TYPE.BOOL).union(TYPE.INT)
				.intersect(TYPE.BOOL.union(TYPE.INT).union(TYPE.FLOAT))
				.equals(TYPE.BOOL.union(TYPE.INT))
			, `
				(null | bool | int) & (bool | int | float)
				==
				(bool | int)
			`);
		});
		describe('TypeUnion', () => {
			it('distributes union operands over intersection: `(B \| C)  & A == (B  & A) \| (C  & A)`.', () => {
				const expr = TYPE.NULL.union(TYPE.INT).intersect(TYPE.VOID.union(TYPE.NULL).union(OBJ.Boolean.FALSETYPE));
				assert.ok(expr.equals(TYPE.NULL), `(null | int) & (void | null | false) == null`);
				assert.deepStrictEqual(expr, TYPE.NULL);
			});
		});
	})


	describe('#union', () => {
		it('1-7 | `T \| never   == T`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.union(TYPE.NEVER).equals(t), `${ t }`);
			})
		})
		it('1-8 | `T \| unknown == unknown`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.union(TYPE.UNKNOWN).equals(TYPE.UNKNOWN), `${ t }`);
			})
		})
		it('2-2 | `A \| B == B \| A`', () => {
			predicate2(builtin_types, (a, b) => {
				assert.ok(a.union(b).equals(b.union(a)), `${ a }, ${ b }`)
			})
		})
		it('2-4 | `(A \| B) \| C == A \| (B \| C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.union(b).union(c).equals(a.union(b.union(c))), `${ a }, ${ b }, ${ c }`)
			})
		})
		it('2-6 | `A \| (B  & C) == (A \| B)  & (A \| C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.union(b.intersect(c)).equals(a.union(b).intersect(a.union(c))), `${ a }, ${ b }, ${ c }`)
			})
		})
		it('extracts constituents of discriminated unions.', () => {
			assert.ok(TYPE.NULL.union(TYPE.BOOL).union(TYPE.INT)
				.union(TYPE.BOOL.union(TYPE.INT).union(TYPE.FLOAT))
				.equals(TYPE.NULL.union(TYPE.BOOL).union(TYPE.INT).union(TYPE.FLOAT))
			, `
				(null | bool | int) | (bool | int | float)
				==
				(null | bool | int | float)
			`);
		});
	})


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
			})
		})
		it('1-2 | `T     <: unknown`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.isSubtypeOf(TYPE.UNKNOWN), `${ t }`);
			})
		})
		it('1-3 | `T       <: never  <->  T == never`', () => {
			builtin_types.forEach((t) => {
				if (t.isSubtypeOf(TYPE.NEVER)) {
					assert.ok(t.equals(TYPE.NEVER), `${ t }`);
				}
			})
		})
		it('1-4 | `unknown <: T      <->  T == unknown`', () => {
			builtin_types.forEach((t) => {
				if (TYPE.UNKNOWN.isSubtypeOf(t)) {
					assert.ok(t.equals(TYPE.UNKNOWN), `${ t }`);
				}
			})
		})
		it('2-7 | `A <: A`', () => {
			builtin_types.forEach((a) => {
				assert.ok(a.isSubtypeOf(a), `${ a }`)
			})
		})
		it('2-8 | `A <: B  &&  B <: A  -->  A == B`', () => {
			predicate2(builtin_types, (a, b) => {
				if (a.isSubtypeOf(b) && b.isSubtypeOf(a)) {
					assert.ok(a.equals(b), `${ a }, ${ b }`)
				}
			})
		})
		it('2-9 | `A <: B  &&  B <: C  -->  A <: C`', () => {
			predicate3(builtin_types, (a, b, c) => {
				if (a.isSubtypeOf(b) && b.isSubtypeOf(c)) {
					assert.ok(a.isSubtypeOf(c), `${ a }, ${ b }, ${ c }`)
				}
			})
		})
		it('3-1 | `A  & B <: A  &&  A  & B <: B`', () => {
			predicate2(builtin_types, (a, b) => {
				assert.ok(a.intersect(b).isSubtypeOf(a), `${ a }, ${ b }`)
				assert.ok(a.intersect(b).isSubtypeOf(b), `${ a }, ${ b }`)
			})
		})
		it('3-2 | `A <: A \| B  &&  B <: A \| B`', () => {
			predicate2(builtin_types, (a, b) => {
				assert.ok(a.isSubtypeOf(a.union(b)), `${ a }, ${ b }`)
				assert.ok(b.isSubtypeOf(a.union(b)), `${ a }, ${ b }`)
			})
		})
		it('3-3 | `A <: B  <->  A  & B == A`', () => {
			predicate2(builtin_types, (a, b) => {
				if (a.isSubtypeOf(b)) {
					assert.ok(a.intersect(b).equals(a), `forward: ${ a }, ${ b }`)
				}
				if (a.intersect(b).equals(a)) {
					assert.ok(a.isSubtypeOf(b), `backward: ${ a }, ${ b }`)
				}
			})
		})
		it('3-4 | `A <: B  <->  A \| B == B`', () => {
			predicate2(builtin_types, (a, b) => {
				if (a.isSubtypeOf(b)) {
					assert.ok(a.union(b).equals(b), `forward: ${ a }, ${ b }`)
				}
				if (a.union(b).equals(b)) {
					assert.ok(a.isSubtypeOf(b), `backward: ${ a }, ${ b }`)
				}
			})
		})
		it('3-5 | `A <: C    &&  A <: D  <->  A <: C  & D`', () => {
			predicate3(builtin_types, (a, c, d) => {
				if (a.isSubtypeOf(c) && a.isSubtypeOf(d)) {
					assert.ok(a.isSubtypeOf(c.intersect(d)), `forward: ${ a }, ${ c }, ${ d }`)
				}
				if (a.isSubtypeOf(c.intersect(d))) {
					assert.ok(a.isSubtypeOf(c) && a.isSubtypeOf(d), `backward: ${ a }, ${ c }, ${ d }`)
				}
			})
		})
		it('3-6 | `A <: C  \|\|  A <: D  -->  A <: C \| D`', () => {
			predicate3(builtin_types, (a, c, d) => {
				if (a.isSubtypeOf(c) || a.isSubtypeOf(d)) {
					assert.ok(a.isSubtypeOf(c.union(d)), `${ a }, ${ c }, ${ d }`)
				}
			})
			assert.ok(
				TYPE.NULL.union(TYPE.INT).isSubtypeOf(TYPE.NULL.union(TYPE.INT)) &&
				!TYPE.NULL.union(TYPE.INT).isSubtypeOf(TYPE.NULL) &&
				!TYPE.NULL.union(TYPE.INT).isSubtypeOf(TYPE.INT),
				'exists A, C, D s.t. `A <: C | D` but `!(A <: C)` and `!(A <: D)`'
			)
		})
		it('3-7 | `A <: C    &&  B <: C  <->  A \| B <: C`', () => {
			predicate3(builtin_types, (a, b, c) => {
				if (a.isSubtypeOf(c) && b.isSubtypeOf(c)) {
					assert.ok(a.union(b).isSubtypeOf(c), `forward: ${ a }, ${ b }, ${ c }`)
				}
				if (a.union(b).isSubtypeOf(c)) {
					assert.ok(a.isSubtypeOf(c) && b.isSubtypeOf(c), `backward: ${ a }, ${ b }, ${ c }`)
				}
			})
		})
		it('3-8 | `A <: C  \|\|  B <: C  -->  A  & B <: C`', () => {
			predicate3(builtin_types, (a, b, c) => {
				if (a.isSubtypeOf(c) || b.isSubtypeOf(c)) {
					assert.ok(a.intersect(b).isSubtypeOf(c), `${ a }, ${ b }, ${ c }`)
				}
			})
			assert.ok(
				TYPE.NULL.intersect(TYPE.INT).isSubtypeOf(TYPE.NULL.intersect(TYPE.INT)) &&
				!TYPE.NULL.isSubtypeOf(TYPE.NULL.intersect(TYPE.INT)) &&
				!TYPE.INT.isSubtypeOf(TYPE.NULL.intersect(TYPE.INT)),
				'exists A, B, C s.t. `A & B <: C` but `!(A <: C)` and `!(B <: C)`'
			)
		})

		it('discrete types.', () => {
			;[
				TYPE.VOID,
				TYPE.NULL,
				TYPE.BOOL,
				TYPE.INT,
				TYPE.FLOAT,
				TYPE.STR,
			].forEach((t, _, arr) => {
				arr.filter((u) => u !== t).forEach((u) => {
					assert.ok(!u.isSubtypeOf(t), `${ u }, ${ t }`)
				})
			})
		})

		describe('TypeUnit', () => {
			it('constant Boolean types should be subtypes of `bool`.', () => {
				assert.ok(OBJ.Boolean.FALSETYPE.isSubtypeOf(TYPE.BOOL), 'Boolean.FALSETYPE');
				assert.ok(OBJ.Boolean.TRUETYPE .isSubtypeOf(TYPE.BOOL), 'Boolean.TRUETYPE');
			})
			it('constant Integer types should be subtypes of `int`.', () => {
				;[42n, -42n, 0n, -0n].map((v) => typeUnitInt(v)).forEach((itype) => {
					assert.ok(itype.isSubtypeOf(TYPE.INT), `${ itype }`)
				})
			})
			it('constant Float types should be subtypes of `float`.', () => {
				;[4.2, -4.2e-2, 0.0, -0.0].map((v) => typeUnitFloat(v)).forEach((ftype) => {
					assert.ok(ftype.isSubtypeOf(TYPE.FLOAT), `${ ftype }`)
				})
			})
			it('constant String types should be subtypes of `str`.', () => {
				['a4.2', 'b-4.2e-2', 'c0.0', 'd-0.0'].map((v) => typeUnitStr(v)).forEach((stype) => {
					assert.ok(stype.isSubtypeOf(TYPE.STR), `${ stype }`);
				});
			});
			it('constant tuple types should be subtype of a tuple type instance.', () => {
				new Map<OBJ.Object, TYPE.TypeTuple>([
					[new OBJ.Tuple(),                                              TYPE.TypeTuple.fromTypes()],
					[new OBJ.Tuple([new OBJ.Integer(42n)]),                        TYPE.TypeTuple.fromTypes([TYPE.INT])],
					[new OBJ.Tuple([new OBJ.Float(4.2), new OBJ.String('hello')]), TYPE.TypeTuple.fromTypes([TYPE.FLOAT, TYPE.STR])],
				]).forEach((tupletype, value) => {
					assert.ok(new TYPE.TypeUnit(value).isSubtypeOf(tupletype), `let x: ${ tupletype } = ${ value };`);
				});
			});
			it('constant record types should be subtype of a record type instance.', () => {
				new Map<OBJ.Object, TYPE.TypeRecord>([
					[new OBJ.Record(new Map<bigint, OBJ.Object>([[0x100n, new OBJ.Integer(42n)]])),                                  TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.INT]]))],
					[new OBJ.Record(new Map<bigint, OBJ.Object>([[0x100n, new OBJ.Float(4.2)], [0x101n, new OBJ.String('hello')]])), TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.FLOAT], [0x101n, TYPE.STR]]))],
					[new OBJ.Record(new Map<bigint, OBJ.Object>([[0x100n, new OBJ.String('hello')], [0x101n, new OBJ.Float(4.2)]])), TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.STR], [0x101n, TYPE.FLOAT]]))],
				]).forEach((recordtype, value) => {
					assert.ok(new TYPE.TypeUnit(value).isSubtypeOf(recordtype), `let x: ${ recordtype } = ${ value };`);
				});
			});
			it('unit list types should be subtype of a list type instance.', () => {
				const input = [
					null,
					[new OBJ.Integer(42n)],
					[new OBJ.Float(4.2), new OBJ.String('hello')],
				] as const;
				const output: TYPE.TypeList[] = [
					TYPE.NEVER,
					TYPE.INT,
					TYPE.FLOAT.union(TYPE.STR),
				].map((t) => new TYPE.TypeList(t));
				new Map<OBJ.Object, TYPE.TypeList>([
					[new OBJ.List(),         output[0]],
					[new OBJ.List(input[1]), output[1]],
					[new OBJ.List(input[2]), output[2]],
				]).forEach((listtype, value) => {
					assert.ok(new TYPE.TypeUnit(value).isSubtypeOf(listtype), `let x: ${ listtype } = ${ value };`);
				});
			});
			it('unit dict types should be subtype of a dict type instance.', () => {
				const input = [
					new Map<bigint, OBJ.Object>([
						[0x100n, new OBJ.Integer(42n)],
					]),
					new Map<bigint, OBJ.Object>([
						[0x100n, new OBJ.Float(4.2)],
						[0x101n, new OBJ.String('hello')],
					]),
					new Map<bigint, OBJ.Object>([
						[0x100n, new OBJ.String('hello')],
						[0x101n, new OBJ.Float(4.2)],
					]),
				] as const;
				const output: TYPE.TypeDict[] = [
					TYPE.INT,
					TYPE.FLOAT.union(TYPE.STR),
					TYPE.STR.union(TYPE.FLOAT),
				].map((t) => new TYPE.TypeDict(t));
				new Map<OBJ.Object, TYPE.TypeDict>([
					[new OBJ.Dict(input[0]), output[0]],
					[new OBJ.Dict(input[1]), output[1]],
					[new OBJ.Dict(input[2]), output[2]],
				]).forEach((dicttype, value) => {
					assert.ok(new TYPE.TypeUnit(value).isSubtypeOf(dicttype), `let x: ${ dicttype } = ${ value };`);
				});
			});
			it('constant set types should be subtype of a set type instance.', () => {
				new Map<OBJ.Object, TYPE.TypeSet>([
					[new OBJ.Set(),                                                       new TYPE.TypeSet(TYPE.NEVER)],
					[new OBJ.Set(new Set([new OBJ.Integer(42n)])),                        new TYPE.TypeSet(TYPE.INT)],
					[new OBJ.Set(new Set([new OBJ.Float(4.2), new OBJ.String('hello')])), new TYPE.TypeSet(TYPE.FLOAT.union(TYPE.STR))],
				]).forEach((settype, value) => {
					assert.ok(new TYPE.TypeUnit(value).isSubtypeOf(settype), `let x: ${ settype } = ${ value };`);
				});
			});
			it('constant map types should be subtype of a map type instance.', () => {
				new Map<OBJ.Object, TYPE.TypeMap>([
					[new OBJ.Map(new Map<OBJ.Object, OBJ.Object>([[new OBJ.Integer(0x100n), new OBJ.Integer(42n)]])),                                                   new TYPE.TypeMap(TYPE.INT, TYPE.INT)],
					[new OBJ.Map(new Map<OBJ.Object, OBJ.Object>([[new OBJ.Integer(0x100n), new OBJ.Float(4.2)], [new OBJ.Integer(0x101n), new OBJ.String('hello')]])), new TYPE.TypeMap(TYPE.INT, TYPE.FLOAT.union(TYPE.STR))],
					[new OBJ.Map(new Map<OBJ.Object, OBJ.Object>([[new OBJ.String('hello'), new OBJ.Integer(0x100n)], [new OBJ.Float(4.2), new OBJ.Integer(0x101n)]])), new TYPE.TypeMap(TYPE.FLOAT.union(TYPE.STR), TYPE.INT)],
				]).forEach((maptype, value) => {
					assert.ok(new TYPE.TypeUnit(value).isSubtypeOf(maptype), `let x: ${ maptype } = ${ value };`);
				});
			});
		})

		describe('TypeTuple', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(TYPE.TypeTuple.fromTypes([
					TYPE.INT,
					TYPE.BOOL,
					TYPE.STR,
				]).isSubtypeOf(TYPE.OBJ), `[int, bool, str] <: obj;`);
				assert.ok(!TYPE.OBJ.isSubtypeOf(TYPE.TypeTuple.fromTypes([
					TYPE.INT,
					TYPE.BOOL,
					TYPE.STR,
				])), `obj !<: [int, bool, str]`);
			});
			it('matches per index.', () => {
				assert.ok(TYPE.TypeTuple.fromTypes([
					TYPE.INT,
					TYPE.BOOL,
					TYPE.STR,
				]).isSubtypeOf(TYPE.TypeTuple.fromTypes([
					TYPE.INT.union(TYPE.FLOAT),
					TYPE.BOOL.union(TYPE.NULL),
					TYPE.OBJ,
				])), `[int, bool, str] <: [int | float, bool?, obj];`);
				assert.ok(!TYPE.TypeTuple.fromTypes([
					TYPE.INT,
					TYPE.BOOL,
					TYPE.STR,
				]).isSubtypeOf(TYPE.TypeTuple.fromTypes([
					TYPE.BOOL.union(TYPE.NULL),
					TYPE.OBJ,
					TYPE.INT.union(TYPE.FLOAT),
				])), `[int, bool, str] !<: [bool!, obj, int | float];`);
			});
			it('returns false if assigned is smaller than assignee.', () => {
				assert.ok(!TYPE.TypeTuple.fromTypes([
					TYPE.INT,
					TYPE.BOOL,
				]).isSubtypeOf(TYPE.TypeTuple.fromTypes([
					TYPE.INT.union(TYPE.FLOAT),
					TYPE.BOOL.union(TYPE.NULL),
					TYPE.OBJ,
				])), `[int, bool] !<: [int | float, bool!, obj];`);
			});
			it('skips rest if assigned is larger than assignee.', () => {
				assert.ok(TYPE.TypeTuple.fromTypes([
					TYPE.INT,
					TYPE.BOOL,
					TYPE.STR,
				]).isSubtypeOf(TYPE.TypeTuple.fromTypes([
					TYPE.INT.union(TYPE.FLOAT),
					TYPE.BOOL.union(TYPE.NULL),
				])), `[int, bool, str] <: [int | float, bool!];`);
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
				])), `[int, int, ?:int, ?:int] <: [int, ?:int, ?:int, ?:int, ?:int]`);
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
				])), `[int, ?:int, ?:int, ?:int, ?:int] !<: [int, int, ?:int, ?:int]`);
			});
			it('Invariance for mutable tuples: `A == B --> mutable Tuple.<A> <: mutable Tuple.<B>`.', () => {
				assert.ok(!TYPE.TypeTuple.fromTypes([TYPE.INT, TYPE.FLOAT], true).isSubtypeOf(TYPE.TypeTuple.fromTypes([TYPE.INT.union(TYPE.NULL), TYPE.FLOAT.union(TYPE.NULL)], true)), `mutable [int, float] !<: mutable [int?, float?]`);
			});
			it('is not a subtype of List', () => {
				return assert.ok(!TYPE.TypeTuple.fromTypes([TYPE.INT], true).isSubtypeOf(new TYPE.TypeList(TYPE.INT, true)), `mutable [int] !<: mutable int[]`);
			});
		});

		describe('TypeRecord', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
					[0x102n, TYPE.STR],
				])).isSubtypeOf(TYPE.OBJ), `[x: int, y: bool, z: str] <: obj;`);
				assert.ok(!TYPE.OBJ.isSubtypeOf(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
					[0x102n, TYPE.STR],
				]))), `obj !<: [x: int, y: bool, z: str]`);
			});
			it('matches per key.', () => {
				assert.ok(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
					[0x102n, TYPE.STR],
				])).isSubtypeOf(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x101n, TYPE.BOOL.union(TYPE.NULL)],
					[0x102n, TYPE.OBJ],
					[0x100n, TYPE.INT.union(TYPE.FLOAT)],
				]))), `[x: int, y: bool, z: str] <: [y: bool!, z: obj, x: int | float];`);
				assert.ok(!TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
					[0x102n, TYPE.STR],
				])).isSubtypeOf(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.BOOL.union(TYPE.NULL)],
					[0x101n, TYPE.OBJ],
					[0x102n, TYPE.INT.union(TYPE.FLOAT)],
				]))), `[x: int, y: bool, z: str] !<: [x: bool!, y: obj, z: int | float];`);
			});
			it('returns false if assigned is smaller than assignee.', () => {
				assert.ok(!TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
				])).isSubtypeOf(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x101n, TYPE.BOOL.union(TYPE.NULL)],
					[0x102n, TYPE.OBJ],
					[0x100n, TYPE.INT.union(TYPE.FLOAT)],
				]))), `[x: int, y: bool] !<: [y: bool!, z: obj, x: int | float];`);
			});
			it('skips rest if assigned is larger than assignee.', () => {
				assert.ok(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.BOOL],
					[0x102n, TYPE.STR],
				])).isSubtypeOf(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x101n, TYPE.BOOL.union(TYPE.NULL)],
					[0x100n, TYPE.INT.union(TYPE.FLOAT)],
				]))), `[x: int, y: bool, z: str] <: [y: bool!, x: int | float];`);
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
				]))), `[x: int, y: bool, z: str] !<: [y: bool!, z: obj, w: int | float]`);
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
				]))), `[a: str, b?: int, c: bool] <: [a?: str, b?: int, c: bool]`);
				assert.ok(!new TYPE.TypeRecord(new Map<bigint, TypeEntry>([
					[0x100n, {type: TYPE.STR,  optional: false}],
					[0x101n, {type: TYPE.INT,  optional: true}],
					[0x102n, {type: TYPE.BOOL, optional: false}],
				])).isSubtypeOf(new TYPE.TypeRecord(new Map<bigint, TypeEntry>([
					[0x100n, {type: TYPE.STR,  optional: true}],
					[0x101n, {type: TYPE.INT,  optional: false}],
					[0x102n, {type: TYPE.BOOL, optional: false}],
				]))), `[a: str, b?: int, c: bool] !<: [a?: str, b: int, c: bool]`);
			});
			it('Invariance for mutable records: `A == B --> mutable Record.<A> <: mutable Record.<B>`.', () => {
				assert.ok(!TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
					[0x101n, TYPE.FLOAT],
				]), true).isSubtypeOf(TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT.union(TYPE.NULL)],
					[0x101n, TYPE.FLOAT.union(TYPE.NULL)],
				]), true)), `mutable [a: int, b: float] !<: mutable [a: int?, b: float?]`);
			});
			it('is not a subtype of Dict', () => {
				return assert.ok(!TYPE.TypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.INT],
				]), true).isSubtypeOf(new TYPE.TypeDict(TYPE.INT, true)), `mutable [a: int] !<: mutable [: int]`);
			});
		});

		describe('TypeList', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(new TYPE.TypeList(TYPE.INT.union(TYPE.BOOL)).isSubtypeOf(TYPE.OBJ), `List.<int | bool> <: obj;`);
				assert.ok(!TYPE.OBJ.isSubtypeOf(new TYPE.TypeList(TYPE.INT.union(TYPE.BOOL))), `obj !<: List.<int | bool>`);
			});
			it('Covariance for immutable lists: `A <: B --> List.<A> <: List.<B>`.', () => {
				assert.ok(new TYPE.TypeList(TYPE.INT).isSubtypeOf(new TYPE.TypeList(TYPE.INT.union(TYPE.FLOAT))), `List.<int> <: List.<int | float>`);
				assert.ok(!new TYPE.TypeList(TYPE.INT.union(TYPE.FLOAT)).isSubtypeOf(new TYPE.TypeList(TYPE.INT)), `List.<int | float> !<: List.<int>`);
			});
			it('Invariance for mutable lists: `A == B --> mutable List.<A> <: mutable List.<B>`.', () => {
				assert.ok(!new TYPE.TypeList(TYPE.INT, true).isSubtypeOf(new TYPE.TypeList(TYPE.INT.union(TYPE.FLOAT), true)), `mutable List.<int> !<: mutable List.<int | float>`);
			});
		});

		describe('TypeDict', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(new TYPE.TypeDict(TYPE.INT.union(TYPE.BOOL)).isSubtypeOf(TYPE.OBJ), `Dict.<int | bool> <: obj;`);
				assert.ok(!TYPE.OBJ.isSubtypeOf(new TYPE.TypeDict(TYPE.INT.union(TYPE.BOOL))), `obj !<: Dict.<int | bool>`);
			});
			it('Covariance for immutable dicts: `A <: B --> Dict.<A> <: Dict.<B>`.', () => {
				assert.ok(new TYPE.TypeDict(TYPE.INT).isSubtypeOf(new TYPE.TypeDict(TYPE.INT.union(TYPE.FLOAT))), `Dict.<int> <: Dict.<int | float>`);
				assert.ok(!new TYPE.TypeDict(TYPE.INT.union(TYPE.FLOAT)).isSubtypeOf(new TYPE.TypeDict(TYPE.INT)), `Dict.<int | float> !<: Dict.<int>`);
			});
			it('Invariance for mutable dicts: `A == B --> mutable Dict.<A> <: mutable Dict.<B>`.', () => {
				assert.ok(!new TYPE.TypeDict(TYPE.INT, true).isSubtypeOf(new TYPE.TypeDict(TYPE.INT.union(TYPE.FLOAT), true)), `mutable Dict.<int> !<: mutable Dict.<int | float>`);
			});
		});

		describe('TypeSet', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(new TYPE.TypeSet(TYPE.INT).isSubtypeOf(TYPE.OBJ), `Set.<int> <: obj`);
				assert.ok(!TYPE.OBJ.isSubtypeOf(new TYPE.TypeSet(TYPE.INT)), `obj !<: Set.<int>`);
			});
			it('Covariance or immutable sets: `A <: B --> Set.<A> <: Set.<B>`.', () => {
				assert.ok(new TYPE.TypeSet(TYPE.INT).isSubtypeOf(new TYPE.TypeSet(TYPE.INT.union(TYPE.FLOAT))), `Set.<int> <: Set.<int | float>`);
				assert.ok(!new TYPE.TypeSet(TYPE.INT.union(TYPE.FLOAT)).isSubtypeOf(new TYPE.TypeSet(TYPE.INT)), `Set.<int | float> !<: Set.<int>`);
			});
			it('Invariance for mutable sets: `A == B --> mutable Set.<A> <: mutable Set.<B>`.', () => {
				assert.ok(!new TYPE.TypeSet(TYPE.INT, true).isSubtypeOf(new TYPE.TypeSet(TYPE.INT.union(TYPE.FLOAT), true)), `mutable Set.<int> !<: mutable Set.<int | float>`);
			});
		});

		describe('TypeMap', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(new TYPE.TypeMap(TYPE.INT, TYPE.BOOL).isSubtypeOf(TYPE.OBJ), `Map.<int, bool> <: obj`);
				assert.ok(!TYPE.OBJ.isSubtypeOf(new TYPE.TypeMap(TYPE.INT, TYPE.BOOL)), `obj !<: Map.<int, bool>`);
			});
			it('Covariance for immutable maps: `A <: C && B <: D --> Map.<A, B> <: Map.<C, D>`.', () => {
				assert.ok(new TYPE.TypeMap(TYPE.INT, TYPE.BOOL).isSubtypeOf(new TYPE.TypeMap(TYPE.INT.union(TYPE.FLOAT), TYPE.BOOL.union(TYPE.NULL))), `Map.<int, bool> <: Map.<int | float, bool | null>`);
				assert.ok(!new TYPE.TypeMap(TYPE.INT.union(TYPE.FLOAT), TYPE.BOOL.union(TYPE.NULL)).isSubtypeOf(new TYPE.TypeMap(TYPE.INT, TYPE.BOOL)), `Map.<int | float, bool | null> !<: Map.<int, bool>`);
			});
			it('Invariance for mutable maps: `A == C && B == D --> mutable Map.<A, B> <: mutable Map.<C, D>`.', () => {
				assert.ok(!new TYPE.TypeMap(TYPE.INT, TYPE.BOOL, true).isSubtypeOf(new TYPE.TypeMap(TYPE.INT.union(TYPE.FLOAT), TYPE.BOOL.union(TYPE.NULL), true)), `mutable Map.<int, bool> !<: mutable Map.<int | float, bool | null>`);
			});
		});

		describe('TypeInterface', () => {
			it('returns `true` if the subtype contains at least the properties of the supertype.', () => {
				assert.ok(!t0.isSubtypeOf(t1))
				assert.ok(!t1.isSubtypeOf(t0))
				assert.ok(new TYPE.TypeInterface(new Map<string, TYPE.Type>([
					['foo', TYPE.STR],
					['bar', TYPE.NULL],
					['diz', TYPE.BOOL],
					['qux', TYPE.INT.union(TYPE.FLOAT)],
				])).isSubtypeOf(t0))
			})
		})
	})


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
				})
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
					const v: OBJ.Tuple<OBJ.Boolean> = new OBJ.Tuple<OBJ.Boolean>([OBJ.Boolean.TRUE, OBJ.Boolean.TRUE]);
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
					const v: OBJ.Record<OBJ.Boolean> = new OBJ.Record<OBJ.Boolean>(new Map<bigint, OBJ.Boolean>([
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
})
