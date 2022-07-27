import * as assert from 'assert'
import {
	TypeEntry,
	TYPE,
	SolidObject,
	SolidBoolean,
	Int16,
	Float64,
	SolidString,
	SolidTuple,
	SolidRecord,
	SolidList,
	SolidDict,
	SolidSet,
	SolidMap,
} from '../../src/typer/index.js';
import {
	typeConstInt,
	typeConstFloat,
	typeConstStr,
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
		TYPE.Type.NEVER,
		TYPE.Type.UNKNOWN,
		TYPE.Type.VOID,
		TYPE.Type.OBJ,
		TYPE.Type.NULL,
		TYPE.Type.BOOL,
		TYPE.Type.INT,
		TYPE.Type.FLOAT,
		TYPE.Type.STR,
	]
	const t0: TYPE.TypeInterface = new TYPE.TypeInterface(new Map<string, TYPE.Type>([
		['foo', TYPE.Type.OBJ],
		['bar', TYPE.Type.NULL],
		['diz', TYPE.Type.BOOL],
	]))
	const t1: TYPE.TypeInterface = new TYPE.TypeInterface(new Map<string, TYPE.Type>([
		['foo', TYPE.Type.OBJ],
		['qux', TYPE.Type.INT.union(TYPE.Type.FLOAT)],
		['diz', TYPE.Type.STR],
	]))


	describe('#includes', () => {
		it('uses `SolidObject#identical` to compare values.', () => {
			function unionOfInts(ns: bigint[]): TYPE.Type {
				return TYPE.Type.unionAll(ns.map<TYPE.Type>(typeConstInt));
			}
			function unionOfFloats(ns: number[]): TYPE.Type {
				return TYPE.Type.unionAll(ns.map<TYPE.Type>(typeConstFloat));
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
			].map((set) => set.map((n) => new Float64(n))), '(4.2 | 4.3 | 4.4) & (4.3 | 4.4 | 4.5) == (4.3 | 4.4)');
			assert.deepStrictEqual([
				t3,
				t4,
				t3.union(t4),
			].map((t) => [...t.values]), [
				[42n, 43n, 44n],
				[43n, 44n, 45n],
				[42n, 43n, 44n, 45n],
			].map((set) => set.map((n) => new Int16(n))), '(42 | 43 | 44) | (43 | 44 | 45) == (42 | 43 | 44 | 45)');
		});
	});


	describe('#intersect', () => {
		it('1-5 | `T  & never   == never`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.intersect(TYPE.Type.NEVER).equals(TYPE.Type.NEVER), `${ t }`);
			})
		})
		it('1-6 | `T  & unknown == T`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.intersect(TYPE.Type.UNKNOWN).equals(t), `${ t }`);
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
			assert.ok(TYPE.Type.NULL.union(TYPE.Type.BOOL).union(TYPE.Type.INT)
				.intersect(TYPE.Type.BOOL.union(TYPE.Type.INT).union(TYPE.Type.FLOAT))
				.equals(TYPE.Type.BOOL.union(TYPE.Type.INT))
			, `
				(null | bool | int) & (bool | int | float)
				==
				(bool | int)
			`);
		});
		describe('SolidTypeUnion', () => {
			it('distributes union operands over intersection: `(B \| C)  & A == (B  & A) \| (C  & A)`.', () => {
				const expr = TYPE.Type.NULL.union(TYPE.Type.INT).intersect(TYPE.Type.VOID.union(TYPE.Type.NULL).union(SolidBoolean.FALSETYPE));
				assert.ok(expr.equals(TYPE.Type.NULL), `(null | int) & (void | null | false) == null`);
				assert.deepStrictEqual(expr, TYPE.Type.NULL);
			});
		});
	})


	describe('#union', () => {
		it('1-7 | `T \| never   == T`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.union(TYPE.Type.NEVER).equals(t), `${ t }`);
			})
		})
		it('1-8 | `T \| unknown == unknown`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.union(TYPE.Type.UNKNOWN).equals(TYPE.Type.UNKNOWN), `${ t }`);
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
			assert.ok(TYPE.Type.NULL.union(TYPE.Type.BOOL).union(TYPE.Type.INT)
				.union(TYPE.Type.BOOL.union(TYPE.Type.INT).union(TYPE.Type.FLOAT))
				.equals(TYPE.Type.NULL.union(TYPE.Type.BOOL).union(TYPE.Type.INT).union(TYPE.Type.FLOAT))
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
				assert.ok(TYPE.Type.NEVER.isSubtypeOf(t), `${ t }`);
			})
		})
		it('1-2 | `T     <: unknown`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.isSubtypeOf(TYPE.Type.UNKNOWN), `${ t }`);
			})
		})
		it('1-3 | `T       <: never  <->  T == never`', () => {
			builtin_types.forEach((t) => {
				if (t.isSubtypeOf(TYPE.Type.NEVER)) {
					assert.ok(t.equals(TYPE.Type.NEVER), `${ t }`);
				}
			})
		})
		it('1-4 | `unknown <: T      <->  T == unknown`', () => {
			builtin_types.forEach((t) => {
				if (TYPE.Type.UNKNOWN.isSubtypeOf(t)) {
					assert.ok(t.equals(TYPE.Type.UNKNOWN), `${ t }`);
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
				TYPE.Type.NULL.union(TYPE.Type.INT).isSubtypeOf(TYPE.Type.NULL.union(TYPE.Type.INT)) &&
				!TYPE.Type.NULL.union(TYPE.Type.INT).isSubtypeOf(TYPE.Type.NULL) &&
				!TYPE.Type.NULL.union(TYPE.Type.INT).isSubtypeOf(TYPE.Type.INT),
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
				TYPE.Type.NULL.intersect(TYPE.Type.INT).isSubtypeOf(TYPE.Type.NULL.intersect(TYPE.Type.INT)) &&
				!TYPE.Type.NULL.isSubtypeOf(TYPE.Type.NULL.intersect(TYPE.Type.INT)) &&
				!TYPE.Type.INT.isSubtypeOf(TYPE.Type.NULL.intersect(TYPE.Type.INT)),
				'exists A, B, C s.t. `A & B <: C` but `!(A <: C)` and `!(B <: C)`'
			)
		})

		it('discrete types.', () => {
			;[
				TYPE.Type.VOID,
				TYPE.Type.NULL,
				TYPE.Type.BOOL,
				TYPE.Type.INT,
				TYPE.Type.FLOAT,
				TYPE.Type.STR,
			].forEach((t, _, arr) => {
				arr.filter((u) => u !== t).forEach((u) => {
					assert.ok(!u.isSubtypeOf(t), `${ u }, ${ t }`)
				})
			})
		})

		describe('SolidTypeUnit', () => {
			it('constant Boolean types should be subtypes of `bool`.', () => {
				assert.ok(SolidBoolean.FALSETYPE.isSubtypeOf(TYPE.Type.BOOL), 'SolidBoolean.FALSETYPE')
				assert.ok(SolidBoolean.TRUETYPE .isSubtypeOf(TYPE.Type.BOOL), 'SolidBoolean.TRUETYPE')
			})
			it('constant Integer types should be subtypes of `int`.', () => {
				;[42n, -42n, 0n, -0n].map((v) => typeConstInt(v)).forEach((itype) => {
					assert.ok(itype.isSubtypeOf(TYPE.Type.INT), `${ itype }`)
				})
			})
			it('constant Float types should be subtypes of `float`.', () => {
				;[4.2, -4.2e-2, 0.0, -0.0].map((v) => typeConstFloat(v)).forEach((ftype) => {
					assert.ok(ftype.isSubtypeOf(TYPE.Type.FLOAT), `${ ftype }`)
				})
			})
			it('constant String types should be subtypes of `str`.', () => {
				['a4.2', 'b-4.2e-2', 'c0.0', 'd-0.0'].map((v) => typeConstStr(v)).forEach((stype) => {
					assert.ok(stype.isSubtypeOf(TYPE.Type.STR), `${ stype }`);
				});
			});
			it('constant tuple types should be subtype of a tuple type instance.', () => {
				new Map<SolidObject, TYPE.SolidTypeTuple>([
					[new SolidTuple(),                                             TYPE.SolidTypeTuple.fromTypes()],
					[new SolidTuple([new Int16(42n)]),                             TYPE.SolidTypeTuple.fromTypes([TYPE.Type.INT])],
					[new SolidTuple([new Float64(4.2), new SolidString('hello')]), TYPE.SolidTypeTuple.fromTypes([TYPE.Type.FLOAT, TYPE.Type.STR])],
				]).forEach((tupletype, value) => {
					assert.ok(new TYPE.SolidTypeUnit(value).isSubtypeOf(tupletype),  `let x: ${ tupletype } = ${ value };`);
				});
			});
			it('constant record types should be subtype of a record type instance.', () => {
				new Map<SolidObject, TYPE.SolidTypeRecord>([
					[new SolidRecord(new Map<bigint, SolidObject>([[0x100n, new Int16(42n)]])),                                       TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.Type.INT]]))],
					[new SolidRecord(new Map<bigint, SolidObject>([[0x100n, new Float64(4.2)], [0x101n, new SolidString('hello')]])), TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.Type.FLOAT], [0x101n, TYPE.Type.STR]]))],
					[new SolidRecord(new Map<bigint, SolidObject>([[0x100n, new SolidString('hello')], [0x101n, new Float64(4.2)]])), TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([[0x100n, TYPE.Type.STR], [0x101n, TYPE.Type.FLOAT]]))],
				]).forEach((recordtype, value) => {
					assert.ok(new TYPE.SolidTypeUnit(value).isSubtypeOf(recordtype),  `let x: ${ recordtype } = ${ value };`);
				});
			});
			it('unit list types should be subtype of a list type instance.', () => {
				const input = [
					null,
					[new Int16(42n)],
					[new Float64(4.2), new SolidString('hello')],
				] as const;
				const output: TYPE.SolidTypeList[] = [
					TYPE.Type.NEVER,
					TYPE.Type.INT,
					TYPE.Type.FLOAT.union(TYPE.Type.STR),
				].map((t) => new TYPE.SolidTypeList(t));
				new Map<SolidObject, TYPE.SolidTypeList>([
					[new SolidList(),         output[0]],
					[new SolidList(input[1]), output[1]],
					[new SolidList(input[2]), output[2]],
				]).forEach((listtype, value) => {
					assert.ok(new TYPE.SolidTypeUnit(value).isSubtypeOf(listtype), `let x: ${ listtype } = ${ value };`);
				});
			});
			it('unit dict types should be subtype of a dict type instance.', () => {
				const input = [
					new Map<bigint, SolidObject>([
						[0x100n, new Int16(42n)],
					]),
					new Map<bigint, SolidObject>([
						[0x100n, new Float64(4.2)],
						[0x101n, new SolidString('hello')],
					]),
					new Map<bigint, SolidObject>([
						[0x100n, new SolidString('hello')],
						[0x101n, new Float64(4.2)],
					]),
				] as const;
				const output: TYPE.SolidTypeDict[] = [
					TYPE.Type.INT,
					TYPE.Type.FLOAT.union(TYPE.Type.STR),
					TYPE.Type.STR.union(TYPE.Type.FLOAT),
				].map((t) => new TYPE.SolidTypeDict(t));
				new Map<SolidObject, TYPE.SolidTypeDict>([
					[new SolidDict(input[0]), output[0]],
					[new SolidDict(input[1]), output[1]],
					[new SolidDict(input[2]), output[2]],
				]).forEach((dicttype, value) => {
					assert.ok(new TYPE.SolidTypeUnit(value).isSubtypeOf(dicttype), `let x: ${ dicttype } = ${ value };`);
				});
			});
			it('constant set types should be subtype of a set type instance.', () => {
				new Map<SolidObject, TYPE.SolidTypeSet>([
					[new SolidSet(),                                                      new TYPE.SolidTypeSet(TYPE.Type.NEVER)],
					[new SolidSet(new Set([new Int16(42n)])),                             new TYPE.SolidTypeSet(TYPE.Type.INT)],
					[new SolidSet(new Set([new Float64(4.2), new SolidString('hello')])), new TYPE.SolidTypeSet(TYPE.Type.FLOAT.union(TYPE.Type.STR))],
				]).forEach((settype, value) => {
					assert.ok(new TYPE.SolidTypeUnit(value).isSubtypeOf(settype), `let x: ${ settype } = ${ value };`);
				});
			});
			it('constant map types should be subtype of a map type instance.', () => {
				new Map<SolidObject, TYPE.SolidTypeMap>([
					[new SolidMap(new Map<SolidObject, SolidObject>([[new Int16(0x100n), new Int16(42n)]])),                                                  new TYPE.SolidTypeMap(TYPE.Type.INT, TYPE.Type.INT)],
					[new SolidMap(new Map<SolidObject, SolidObject>([[new Int16(0x100n), new Float64(4.2)], [new Int16(0x101n), new SolidString('hello')]])), new TYPE.SolidTypeMap(TYPE.Type.INT, TYPE.Type.FLOAT.union(TYPE.Type.STR))],
					[new SolidMap(new Map<SolidObject, SolidObject>([[new SolidString('hello'), new Int16(0x100n)], [new Float64(4.2), new Int16(0x101n)]])), new TYPE.SolidTypeMap(TYPE.Type.FLOAT.union(TYPE.Type.STR), TYPE.Type.INT)],
				]).forEach((maptype, value) => {
					assert.ok(new TYPE.SolidTypeUnit(value).isSubtypeOf(maptype), `let x: ${ maptype } = ${ value };`);
				});
			});
		})

		describe('SolidTypeTuple', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(TYPE.SolidTypeTuple.fromTypes([
					TYPE.Type.INT,
					TYPE.Type.BOOL,
					TYPE.Type.STR,
				]).isSubtypeOf(TYPE.Type.OBJ), `[int, bool, str] <: obj;`);
				assert.ok(!TYPE.Type.OBJ.isSubtypeOf(TYPE.SolidTypeTuple.fromTypes([
					TYPE.Type.INT,
					TYPE.Type.BOOL,
					TYPE.Type.STR,
				])), `obj !<: [int, bool, str]`);
			});
			it('matches per index.', () => {
				assert.ok(TYPE.SolidTypeTuple.fromTypes([
					TYPE.Type.INT,
					TYPE.Type.BOOL,
					TYPE.Type.STR,
				]).isSubtypeOf(TYPE.SolidTypeTuple.fromTypes([
					TYPE.Type.INT.union(TYPE.Type.FLOAT),
					TYPE.Type.BOOL.union(TYPE.Type.NULL),
					TYPE.Type.OBJ,
				])), `[int, bool, str] <: [int | float, bool?, obj];`);
				assert.ok(!TYPE.SolidTypeTuple.fromTypes([
					TYPE.Type.INT,
					TYPE.Type.BOOL,
					TYPE.Type.STR,
				]).isSubtypeOf(TYPE.SolidTypeTuple.fromTypes([
					TYPE.Type.BOOL.union(TYPE.Type.NULL),
					TYPE.Type.OBJ,
					TYPE.Type.INT.union(TYPE.Type.FLOAT),
				])), `[int, bool, str] !<: [bool!, obj, int | float];`);
			});
			it('returns false if assigned is smaller than assignee.', () => {
				assert.ok(!TYPE.SolidTypeTuple.fromTypes([
					TYPE.Type.INT,
					TYPE.Type.BOOL,
				]).isSubtypeOf(TYPE.SolidTypeTuple.fromTypes([
					TYPE.Type.INT.union(TYPE.Type.FLOAT),
					TYPE.Type.BOOL.union(TYPE.Type.NULL),
					TYPE.Type.OBJ,
				])), `[int, bool] !<: [int | float, bool!, obj];`);
			});
			it('skips rest if assigned is larger than assignee.', () => {
				assert.ok(TYPE.SolidTypeTuple.fromTypes([
					TYPE.Type.INT,
					TYPE.Type.BOOL,
					TYPE.Type.STR,
				]).isSubtypeOf(TYPE.SolidTypeTuple.fromTypes([
					TYPE.Type.INT.union(TYPE.Type.FLOAT),
					TYPE.Type.BOOL.union(TYPE.Type.NULL),
				])), `[int, bool, str] <: [int | float, bool!];`);
			});
			it('with optional entries, checks minimum count only.', () => {
				assert.ok(new TYPE.SolidTypeTuple([
					{type: TYPE.Type.INT, optional: false},
					{type: TYPE.Type.INT, optional: false},
					{type: TYPE.Type.INT, optional: true},
					{type: TYPE.Type.INT, optional: true},
				]).isSubtypeOf(new TYPE.SolidTypeTuple([
					{type: TYPE.Type.INT, optional: false},
					{type: TYPE.Type.INT, optional: true},
					{type: TYPE.Type.INT, optional: true},
					{type: TYPE.Type.INT, optional: true},
					{type: TYPE.Type.INT, optional: true},
				])), `[int, int, ?:int, ?:int] <: [int, ?:int, ?:int, ?:int, ?:int]`);
				assert.ok(!new TYPE.SolidTypeTuple([
					{type: TYPE.Type.INT, optional: false},
					{type: TYPE.Type.INT, optional: true},
					{type: TYPE.Type.INT, optional: true},
					{type: TYPE.Type.INT, optional: true},
					{type: TYPE.Type.INT, optional: true},
				]).isSubtypeOf(new TYPE.SolidTypeTuple([
					{type: TYPE.Type.INT, optional: false},
					{type: TYPE.Type.INT, optional: false},
					{type: TYPE.Type.INT, optional: true},
					{type: TYPE.Type.INT, optional: true},
				])), `[int, ?:int, ?:int, ?:int, ?:int] !<: [int, int, ?:int, ?:int]`);
			});
			it('Invariance for mutable tuples: `A == B --> mutable Tuple.<A> <: mutable Tuple.<B>`.', () => {
				assert.ok(!TYPE.SolidTypeTuple.fromTypes([TYPE.Type.INT, TYPE.Type.FLOAT], true).isSubtypeOf(TYPE.SolidTypeTuple.fromTypes([TYPE.Type.INT.union(TYPE.Type.NULL), TYPE.Type.FLOAT.union(TYPE.Type.NULL)], true)), `mutable [int, float] !<: mutable [int?, float?]`);
			});
		});

		describe('SolidTypeRecord', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.Type.INT],
					[0x101n, TYPE.Type.BOOL],
					[0x102n, TYPE.Type.STR],
				])).isSubtypeOf(TYPE.Type.OBJ), `[x: int, y: bool, z: str] <: obj;`);
				assert.ok(!TYPE.Type.OBJ.isSubtypeOf(TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.Type.INT],
					[0x101n, TYPE.Type.BOOL],
					[0x102n, TYPE.Type.STR],
				]))), `obj !<: [x: int, y: bool, z: str]`);
			});
			it('matches per key.', () => {
				assert.ok(TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.Type.INT],
					[0x101n, TYPE.Type.BOOL],
					[0x102n, TYPE.Type.STR],
				])).isSubtypeOf(TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x101n, TYPE.Type.BOOL.union(TYPE.Type.NULL)],
					[0x102n, TYPE.Type.OBJ],
					[0x100n, TYPE.Type.INT.union(TYPE.Type.FLOAT)],
				]))), `[x: int, y: bool, z: str] <: [y: bool!, z: obj, x: int | float];`);
				false && assert.ok(!TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.Type.INT],
					[0x101n, TYPE.Type.BOOL],
					[0x102n, TYPE.Type.STR],
				])).isSubtypeOf(TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.Type.BOOL.union(TYPE.Type.NULL)],
					[0x101n, TYPE.Type.OBJ],
					[0x102n, TYPE.Type.INT.union(TYPE.Type.FLOAT)],
				]))), `[x: int, y: bool, z: str] !<: [x: bool!, y: obj, z: int | float];`);
			});
			it('returns false if assigned is smaller than assignee.', () => {
				assert.ok(!TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.Type.INT],
					[0x101n, TYPE.Type.BOOL],
				])).isSubtypeOf(TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x101n, TYPE.Type.BOOL.union(TYPE.Type.NULL)],
					[0x102n, TYPE.Type.OBJ],
					[0x100n, TYPE.Type.INT.union(TYPE.Type.FLOAT)],
				]))), `[x: int, y: bool] !<: [y: bool!, z: obj, x: int | float];`);
			});
			it('skips rest if assigned is larger than assignee.', () => {
				assert.ok(TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.Type.INT],
					[0x101n, TYPE.Type.BOOL],
					[0x102n, TYPE.Type.STR],
				])).isSubtypeOf(TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x101n, TYPE.Type.BOOL.union(TYPE.Type.NULL)],
					[0x100n, TYPE.Type.INT.union(TYPE.Type.FLOAT)],
				]))), `[x: int, y: bool, z: str] <: [y: bool!, x: int | float];`);
			});
			it('returns false if assignee contains keys that assigned does not.', () => {
				assert.ok(!TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.Type.INT],
					[0x101n, TYPE.Type.BOOL],
					[0x102n, TYPE.Type.STR],
				])).isSubtypeOf(TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x101n, TYPE.Type.BOOL.union(TYPE.Type.NULL)],
					[0x102n, TYPE.Type.OBJ],
					[0x103n, TYPE.Type.INT.union(TYPE.Type.FLOAT)],
				]))), `[x: int, y: bool, z: str] !<: [y: bool!, z: obj, w: int | float]`);
			});
			it('optional entries are not assignable to required entries.', () => {
				assert.ok(new TYPE.SolidTypeRecord(new Map<bigint, TypeEntry>([
					[0x100n, {type: TYPE.Type.STR,  optional: false}],
					[0x101n, {type: TYPE.Type.INT,  optional: true}],
					[0x102n, {type: TYPE.Type.BOOL, optional: false}],
				])).isSubtypeOf(new TYPE.SolidTypeRecord(new Map<bigint, TypeEntry>([
					[0x100n, {type: TYPE.Type.STR,  optional: true}],
					[0x101n, {type: TYPE.Type.INT,  optional: true}],
					[0x102n, {type: TYPE.Type.BOOL, optional: false}],
				]))), `[a: str, b?: int, c: bool] <: [a?: str, b?: int, c: bool]`);
				assert.ok(!new TYPE.SolidTypeRecord(new Map<bigint, TypeEntry>([
					[0x100n, {type: TYPE.Type.STR,  optional: false}],
					[0x101n, {type: TYPE.Type.INT,  optional: true}],
					[0x102n, {type: TYPE.Type.BOOL, optional: false}],
				])).isSubtypeOf(new TYPE.SolidTypeRecord(new Map<bigint, TypeEntry>([
					[0x100n, {type: TYPE.Type.STR,  optional: true}],
					[0x101n, {type: TYPE.Type.INT,  optional: false}],
					[0x102n, {type: TYPE.Type.BOOL, optional: false}],
				]))), `[a: str, b?: int, c: bool] !<: [a?: str, b: int, c: bool]`);
			});
			it('Invariance for mutable records: `A == B --> mutable Record.<A> <: mutable Record.<B>`.', () => {
				assert.ok(!TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.Type.INT],
					[0x101n, TYPE.Type.FLOAT],
				]), true).isSubtypeOf(TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.Type.INT.union(TYPE.Type.NULL)],
					[0x101n, TYPE.Type.FLOAT.union(TYPE.Type.NULL)],
				]), true)), `mutable [a: int, b: float] !<: mutable [a: int?, b: float?]`);
			});
		});

		describe('SolidTypeList', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(new TYPE.SolidTypeList(TYPE.Type.INT.union(TYPE.Type.BOOL)).isSubtypeOf(TYPE.Type.OBJ), `List.<int | bool> <: obj;`);
				assert.ok(!TYPE.Type.OBJ.isSubtypeOf(new TYPE.SolidTypeList(TYPE.Type.INT.union(TYPE.Type.BOOL))), `obj !<: List.<int | bool>`);
			});
			it('Covariance for immutable lists: `A <: B --> List.<A> <: List.<B>`.', () => {
				assert.ok(new TYPE.SolidTypeList(TYPE.Type.INT).isSubtypeOf(new TYPE.SolidTypeList(TYPE.Type.INT.union(TYPE.Type.FLOAT))), `List.<int> <: List.<int | float>`);
				assert.ok(!new TYPE.SolidTypeList(TYPE.Type.INT.union(TYPE.Type.FLOAT)).isSubtypeOf(new TYPE.SolidTypeList(TYPE.Type.INT)), `List.<int | float> !<: List.<int>`);
			});
			it('Invariance for mutable lists: `A == B --> mutable List.<A> <: mutable List.<B>`.', () => {
				assert.ok(!new TYPE.SolidTypeList(TYPE.Type.INT, true).isSubtypeOf(new TYPE.SolidTypeList(TYPE.Type.INT.union(TYPE.Type.FLOAT), true)), `mutable List.<int> !<: mutable List.<int | float>`);
			});
		});

		describe('SolidTypeDict', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(new TYPE.SolidTypeDict(TYPE.Type.INT.union(TYPE.Type.BOOL)).isSubtypeOf(TYPE.Type.OBJ), `Dict.<int | bool> <: obj;`);
				assert.ok(!TYPE.Type.OBJ.isSubtypeOf(new TYPE.SolidTypeDict(TYPE.Type.INT.union(TYPE.Type.BOOL))), `obj !<: Dict.<int | bool>`);
			});
			it('Covariance for immutable dicts: `A <: B --> Dict.<A> <: Dict.<B>`.', () => {
				assert.ok(new TYPE.SolidTypeDict(TYPE.Type.INT).isSubtypeOf(new TYPE.SolidTypeDict(TYPE.Type.INT.union(TYPE.Type.FLOAT))), `Dict.<int> <: Dict.<int | float>`);
				assert.ok(!new TYPE.SolidTypeDict(TYPE.Type.INT.union(TYPE.Type.FLOAT)).isSubtypeOf(new TYPE.SolidTypeDict(TYPE.Type.INT)), `Dict.<int | float> !<: Dict.<int>`);
			});
			it('Invariance for mutable dicts: `A == B --> mutable Dict.<A> <: mutable Dict.<B>`.', () => {
				assert.ok(!new TYPE.SolidTypeDict(TYPE.Type.INT, true).isSubtypeOf(new TYPE.SolidTypeDict(TYPE.Type.INT.union(TYPE.Type.FLOAT), true)), `mutable Dict.<int> !<: mutable Dict.<int | float>`);
			});
		});

		describe('SolidTypeSet', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(new TYPE.SolidTypeSet(TYPE.Type.INT).isSubtypeOf(TYPE.Type.OBJ), `Set.<int> <: obj`);
				assert.ok(!TYPE.Type.OBJ.isSubtypeOf(new TYPE.SolidTypeSet(TYPE.Type.INT)), `obj !<: Set.<int>`);
			});
			it('Covariance or immutable sets: `A <: B --> Set.<A> <: Set.<B>`.', () => {
				assert.ok(new TYPE.SolidTypeSet(TYPE.Type.INT).isSubtypeOf(new TYPE.SolidTypeSet(TYPE.Type.INT.union(TYPE.Type.FLOAT))), `Set.<int> <: Set.<int | float>`);
				assert.ok(!new TYPE.SolidTypeSet(TYPE.Type.INT.union(TYPE.Type.FLOAT)).isSubtypeOf(new TYPE.SolidTypeSet(TYPE.Type.INT)), `Set.<int | float> !<: Set.<int>`);
			});
			it('Invariance for mutable sets: `A == B --> mutable Set.<A> <: mutable Set.<B>`.', () => {
				assert.ok(!new TYPE.SolidTypeSet(TYPE.Type.INT, true).isSubtypeOf(new TYPE.SolidTypeSet(TYPE.Type.INT.union(TYPE.Type.FLOAT), true)), `mutable Set.<int> !<: mutable Set.<int | float>`);
			});
		});

		describe('SolidTypeMap', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(new TYPE.SolidTypeMap(TYPE.Type.INT, TYPE.Type.BOOL).isSubtypeOf(TYPE.Type.OBJ), `Map.<int, bool> <: obj`);
				assert.ok(!TYPE.Type.OBJ.isSubtypeOf(new TYPE.SolidTypeMap(TYPE.Type.INT, TYPE.Type.BOOL)), `obj !<: Map.<int, bool>`);
			});
			it('Covariance for immutable maps: `A <: C && B <: D --> Map.<A, B> <: Map.<C, D>`.', () => {
				assert.ok(new TYPE.SolidTypeMap(TYPE.Type.INT, TYPE.Type.BOOL).isSubtypeOf(new TYPE.SolidTypeMap(TYPE.Type.INT.union(TYPE.Type.FLOAT), TYPE.Type.BOOL.union(TYPE.Type.NULL))), `Map.<int, bool> <: Map.<int | float, bool | null>`);
				assert.ok(!new TYPE.SolidTypeMap(TYPE.Type.INT.union(TYPE.Type.FLOAT), TYPE.Type.BOOL.union(TYPE.Type.NULL)).isSubtypeOf(new TYPE.SolidTypeMap(TYPE.Type.INT, TYPE.Type.BOOL)), `Map.<int | float, bool | null> !<: Map.<int, bool>`);
			});
			it('Invariance for mutable maps: `A == C && B == D --> mutable Map.<A, B> <: mutable Map.<C, D>`.', () => {
				assert.ok(!new TYPE.SolidTypeMap(TYPE.Type.INT, TYPE.Type.BOOL, true).isSubtypeOf(new TYPE.SolidTypeMap(TYPE.Type.INT.union(TYPE.Type.FLOAT), TYPE.Type.BOOL.union(TYPE.Type.NULL), true)), `mutable Map.<int, bool> !<: mutable Map.<int | float, bool | null>`);
			});
		});

		describe('TypeInterface', () => {
			it('returns `true` if the subtype contains at least the properties of the supertype.', () => {
				assert.ok(!t0.isSubtypeOf(t1))
				assert.ok(!t1.isSubtypeOf(t0))
				assert.ok(new TYPE.TypeInterface(new Map<string, TYPE.Type>([
					['foo', TYPE.Type.STR],
					['bar', TYPE.Type.NULL],
					['diz', TYPE.Type.BOOL],
					['qux', TYPE.Type.INT.union(TYPE.Type.FLOAT)],
				])).isSubtypeOf(t0))
			})
		})
	})


	describe('#mutableOf', () => {
		it('mutable types are subtypes of their immutable counterparts.', () => {
			[
				...builtin_types,
				TYPE.SolidTypeTuple.fromTypes([
					TYPE.Type.INT,
					TYPE.Type.FLOAT,
					TYPE.Type.STR,
				]),
				TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.Type.INT],
					[0x101n, TYPE.Type.FLOAT],
					[0x102n, TYPE.Type.STR],
				])),
				new TYPE.SolidTypeList(TYPE.Type.BOOL),
				new TYPE.SolidTypeDict(TYPE.Type.BOOL),
				new TYPE.SolidTypeSet(TYPE.Type.NULL),
				new TYPE.SolidTypeMap(TYPE.Type.INT, TYPE.Type.FLOAT),
			].forEach((t) => {
				assert.ok(t.mutableOf().isSubtypeOf(t), `mutable ${ t } <: ${ t }`);
			});
		});
		it('non-constant mutable types are not equal to their immutable counterparts.', () => {
			[
				TYPE.SolidTypeTuple.fromTypes([
					TYPE.Type.INT,
					TYPE.Type.FLOAT,
					TYPE.Type.STR,
				]),
				TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.Type.INT],
					[0x101n, TYPE.Type.FLOAT],
					[0x102n, TYPE.Type.STR],
				])),
				new TYPE.SolidTypeList(TYPE.Type.BOOL),
				new TYPE.SolidTypeDict(TYPE.Type.BOOL),
				new TYPE.SolidTypeSet(TYPE.Type.NULL),
				new TYPE.SolidTypeMap(TYPE.Type.INT, TYPE.Type.FLOAT),
			].forEach((t) => {
				assert.ok(!t.mutableOf().equals(t), `mutable ${ t } != ${ t }`);
			});
		});
		it('non-constant immutable types are not subtypes of their mutable counterparts.', () => {
			[
				TYPE.SolidTypeTuple.fromTypes([
					TYPE.Type.INT,
					TYPE.Type.FLOAT,
					TYPE.Type.STR,
				]),
				TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.Type.INT],
					[0x101n, TYPE.Type.FLOAT],
					[0x102n, TYPE.Type.STR],
				])),
				new TYPE.SolidTypeList(TYPE.Type.BOOL),
				new TYPE.SolidTypeDict(TYPE.Type.BOOL),
				new TYPE.SolidTypeSet(TYPE.Type.NULL),
				new TYPE.SolidTypeMap(TYPE.Type.INT, TYPE.Type.FLOAT),
			].forEach((t) => {
				assert.ok(!t.isSubtypeOf(t.mutableOf()), `${ t } !<: mutable ${ t }`);
			});
		});
		context('disributes over binary operations.', () => {
			const types: TYPE.Type[] = [
				TYPE.Type.NEVER,
				TYPE.Type.UNKNOWN,
				TYPE.Type.VOID,
				TYPE.Type.OBJ,
				TYPE.Type.NULL,
				TYPE.Type.BOOL,
				TYPE.Type.INT,
				TYPE.Type.FLOAT,
				TYPE.Type.STR,
				TYPE.SolidTypeTuple.fromTypes([
					TYPE.Type.INT,
					TYPE.Type.FLOAT,
					TYPE.Type.STR,
				]),
				TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
					[0x100n, TYPE.Type.INT],
					[0x101n, TYPE.Type.FLOAT],
					[0x102n, TYPE.Type.STR],
				])),
				new TYPE.SolidTypeList(TYPE.Type.BOOL),
				new TYPE.SolidTypeDict(TYPE.Type.BOOL),
				new TYPE.SolidTypeSet(TYPE.Type.NULL),
				new TYPE.SolidTypeMap(TYPE.Type.INT, TYPE.Type.FLOAT),
			];
			specify('mutable (A - B) == mutable A - mutable B', () => {
				predicate2(types, (a, b) => {
					const difference: TYPE.Type = a.subtract(b).mutableOf();
					assert.ok(difference.equals(a.mutableOf().subtract(b.mutableOf())), `${ a }, ${ b }`);
					if (difference instanceof TYPE.SolidTypeDifference) {
						assert.ok(!difference.isMutable, 'SolidTypeDifference#isMutable === false');
					}
				});
			});
			specify('mutable (A & B) == mutable A & mutable B', () => {
				predicate2(types, (a, b) => {
					const intersection: TYPE.Type = a.intersect(b).mutableOf();
					assert.ok(intersection.equals(a.mutableOf().intersect(b.mutableOf())), `${ a }, ${ b }`);
					if (intersection instanceof TYPE.SolidTypeIntersection) {
						assert.ok(!intersection.isMutable, 'SolidTypeIntersection#isMutable === false');
					}
				});
			});
			specify('mutable (A | B) == mutable A | mutable B', () => {
				predicate2(types, (a, b) => {
					const union: TYPE.Type = a.union(b).mutableOf();
					assert.ok(union.equals(a.mutableOf().union(b.mutableOf())), `${ a }, ${ b }`);
					if (union instanceof TYPE.SolidTypeUnion) {
						assert.ok(!union.isMutable, 'SolidTypeUnion#isMutable === false');
					}
				});
			});
		});
	});


	describe('SolidTypeIntersection', () => {
		describe('#combineTuplesOrRecords', () => {
			context('with tuple operands.', () => {
				it('takes the union of indices of constituent types.', () => {
					assert.ok(TYPE.SolidTypeTuple.fromTypes([
						TYPE.Type.OBJ,
						TYPE.Type.NULL,
						TYPE.Type.BOOL,
					]).intersectWithTuple(TYPE.SolidTypeTuple.fromTypes([
						TYPE.Type.OBJ,
						TYPE.Type.INT,
					])).equals(TYPE.SolidTypeTuple.fromTypes([
						TYPE.Type.OBJ,
						TYPE.Type.NULL.intersect(TYPE.Type.INT),
						TYPE.Type.BOOL,
					])), `
						[obj, null, bool] & [obj, int]
						==
						[obj, null & int, bool]
					`);
				});
				it('takes the conjunction of optionality.', () => {
					assert.ok(new TYPE.SolidTypeTuple([
						{type: TYPE.Type.OBJ,  optional: false},
						{type: TYPE.Type.NULL, optional: true},
						{type: TYPE.Type.BOOL, optional: true},
					]).intersectWithTuple(new TYPE.SolidTypeTuple([
						{type: TYPE.Type.OBJ,   optional: false},
						{type: TYPE.Type.INT,   optional: false},
						{type: TYPE.Type.FLOAT, optional: true},
					])).equals(new TYPE.SolidTypeTuple([
						{type: TYPE.Type.OBJ,                                  optional: false},
						{type: TYPE.Type.NULL.intersect(TYPE.Type.INT),   optional: false},
						{type: TYPE.Type.BOOL.intersect(TYPE.Type.FLOAT), optional: true},
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
					assert.ok(TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
						[foo, TYPE.Type.OBJ],
						[bar, TYPE.Type.NULL],
						[qux, TYPE.Type.BOOL],
					])).intersectWithRecord(TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
						[foo, TYPE.Type.OBJ],
						[diz, TYPE.Type.INT],
						[qux, TYPE.Type.STR],
					]))).equals(TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
						[foo, TYPE.Type.OBJ],
						[bar, TYPE.Type.NULL],
						[qux, TYPE.Type.BOOL.intersect(TYPE.Type.STR)],
						[diz, TYPE.Type.INT],
					]))), `
						[foo: obj, bar: null, qux: bool] & [foo: obj, diz: int, qux: str]
						==
						[foo: obj, bar: null, qux: bool & str, diz: int]
					`);
				})
				it('takes the conjunction of optionality.', () => {
					const [foo, bar, qux, diz] = [0x100n, 0x101n, 0x102n, 0x103n];
					assert.ok(new TYPE.SolidTypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: TYPE.Type.OBJ,  optional: false}],
						[bar, {type: TYPE.Type.NULL, optional: true}],
						[qux, {type: TYPE.Type.BOOL, optional: true}],
					])).intersectWithRecord(new TYPE.SolidTypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: TYPE.Type.OBJ, optional: false}],
						[diz, {type: TYPE.Type.INT, optional: true}],
						[qux, {type: TYPE.Type.STR, optional: false}],
					]))).equals(new TYPE.SolidTypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: TYPE.Type.OBJ,                                optional: false}],
						[bar, {type: TYPE.Type.NULL,                               optional: true}],
						[qux, {type: TYPE.Type.BOOL.intersect(TYPE.Type.STR), optional: false}],
						[diz, {type: TYPE.Type.INT,                                optional: true}],
					]))), `
						[foo: obj, bar?: null, qux?: bool] & [foo: obj, diz?: int, qux: str]
						==
						[foo: obj, bar?: null, qux: bool & str, diz?: int]
					`);
				});
			});
		});
	});


	describe('SolidTypeUnion', () => {
		describe('#combineTuplesOrRecords', () => {
			context('with tuple operands.', () => {
				it('takes the intersection of indices of constituent types.', () => {
					assert.ok(TYPE.SolidTypeTuple.fromTypes([
						TYPE.Type.OBJ,
						TYPE.Type.NULL,
						TYPE.Type.BOOL,
					]).unionWithTuple(TYPE.SolidTypeTuple.fromTypes([
						TYPE.Type.OBJ,
						TYPE.Type.INT,
					])).equals(TYPE.SolidTypeTuple.fromTypes([
						TYPE.Type.OBJ,
						TYPE.Type.NULL.union(TYPE.Type.INT),
					])), `
						[obj, null, bool] | [obj, int]
						==
						[obj, null | int]
					`);
				});
				it('takes the disjunction of optionality.', () => {
					assert.ok(new TYPE.SolidTypeTuple([
						{type: TYPE.Type.OBJ,  optional: false},
						{type: TYPE.Type.NULL, optional: true},
						{type: TYPE.Type.BOOL, optional: true},
					]).unionWithTuple(new TYPE.SolidTypeTuple([
						{type: TYPE.Type.OBJ,   optional: false},
						{type: TYPE.Type.INT,   optional: false},
						{type: TYPE.Type.FLOAT, optional: true},
					])).equals(new TYPE.SolidTypeTuple([
						{type: TYPE.Type.OBJ,                              optional: false},
						{type: TYPE.Type.NULL.union(TYPE.Type.INT),   optional: true},
						{type: TYPE.Type.BOOL.union(TYPE.Type.FLOAT), optional: true},
					])), `
						[obj, ?: null, ?: bool] | [obj, int, ?: float]
						==
						[obj, ?: null | int, ?: bool | float]
					`);
				});
				it('some value assignable to combo type might not be assignable to union.', () => {
					const left: TYPE.SolidTypeTuple = TYPE.SolidTypeTuple.fromTypes([
						TYPE.Type.BOOL,
						TYPE.Type.INT,
					]);
					const right: TYPE.SolidTypeTuple = TYPE.SolidTypeTuple.fromTypes([
						TYPE.Type.INT,
						TYPE.Type.BOOL,
					]);
					const union: TYPE.Type = left.union(right);
					assert.ok(union instanceof TYPE.SolidTypeUnion);
					const v: SolidTuple<SolidBoolean> = new SolidTuple<SolidBoolean>([SolidBoolean.TRUE, SolidBoolean.TRUE]);
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
					assert.ok(TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
						[foo, TYPE.Type.OBJ],
						[bar, TYPE.Type.NULL],
						[qux, TYPE.Type.BOOL],
					])).unionWithRecord(TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
						[foo, TYPE.Type.OBJ],
						[diz, TYPE.Type.INT],
						[qux, TYPE.Type.STR],
					]))).equals(TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
						[foo, TYPE.Type.OBJ],
						[qux, TYPE.Type.BOOL.union(TYPE.Type.STR)],
					]))), `
						[foo: obj, bar: null, qux: bool] | [foo: obj, diz: int, qux: str]
						==
						[foo: obj, qux: bool | str]
					`);
				});
				it('takes the disjunction of optionality.', () => {
					const [foo, bar, qux, diz] = [0x100n, 0x101n, 0x102n, 0x103n];
					assert.ok(new TYPE.SolidTypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: TYPE.Type.OBJ,  optional: false}],
						[bar, {type: TYPE.Type.NULL, optional: true}],
						[qux, {type: TYPE.Type.BOOL, optional: true}],
					])).unionWithRecord(new TYPE.SolidTypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: TYPE.Type.OBJ, optional: false}],
						[diz, {type: TYPE.Type.INT, optional: true}],
						[qux, {type: TYPE.Type.STR, optional: false}],
					]))).equals(new TYPE.SolidTypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: TYPE.Type.OBJ,                            optional: false}],
						[qux, {type: TYPE.Type.BOOL.union(TYPE.Type.STR), optional: true}],
					]))), `
						[foo: obj, bar?: null, qux?: bool] | [foo: obj, diz?: int, qux: str]
						==
						[foo: obj, qux?: bool | str]
					`);
				});
				it('some value assignable to combo type might not be assignable to union.', () => {
					const left: TYPE.SolidTypeRecord = TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
						[0x100n, TYPE.Type.BOOL],
						[0x101n, TYPE.Type.INT],
						[0x102n, TYPE.Type.STR],
					]));
					const right: TYPE.SolidTypeRecord = TYPE.SolidTypeRecord.fromTypes(new Map<bigint, TYPE.Type>([
						[0x103n, TYPE.Type.STR],
						[0x100n, TYPE.Type.INT],
						[0x101n, TYPE.Type.BOOL],
					]));
					const union: TYPE.Type = left.union(right);
					assert.ok(union instanceof TYPE.SolidTypeUnion);
					const v: SolidRecord<SolidBoolean> = new SolidRecord<SolidBoolean>(new Map<bigint, SolidBoolean>([
						[0x100n, SolidBoolean.TRUE],
						[0x101n, SolidBoolean.TRUE],
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
