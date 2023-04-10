import * as assert from 'assert'
import binaryen from 'binaryen';
import {
	TypeEntry,
	SolidType,
	SolidTypeIntersection,
	SolidTypeUnion,
	SolidTypeDifference,
	SolidTypeUnit,
	SolidTypeInterface,
	SolidTypeTuple,
	SolidTypeRecord,
	SolidTypeList,
	SolidTypeDict,
	SolidTypeSet,
	SolidTypeMap,
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
	BinEither,
} from '../../src/index.js';
import {
	typeConstInt,
	typeConstFloat,
	typeConstStr,
} from '../helpers.js';



describe('SolidType', () => {
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
	const builtin_types: SolidType[] = [
		SolidType.NEVER,
		SolidType.UNKNOWN,
		SolidType.VOID,
		SolidType.OBJ,
		SolidType.NULL,
		SolidType.BOOL,
		SolidType.INT,
		SolidType.FLOAT,
		SolidType.STR,
	]
	const t0: SolidTypeInterface = new SolidTypeInterface(new Map<string, SolidType>([
		['foo', SolidType.OBJ],
		['bar', SolidType.NULL],
		['diz', SolidType.BOOL],
	]))
	const t1: SolidTypeInterface = new SolidTypeInterface(new Map<string, SolidType>([
		['foo', SolidType.OBJ],
		['qux', SolidType.INT.union(SolidType.FLOAT)],
		['diz', SolidType.STR],
	]))


	describe('#includes', () => {
		it('uses `SolidObject#identical` to compare values.', () => {
			function unionOfInts(ns: bigint[]): SolidType {
				return SolidType.unionAll(ns.map<SolidType>(typeConstInt));
			}
			function unionOfFloats(ns: number[]): SolidType {
				return SolidType.unionAll(ns.map<SolidType>(typeConstFloat));
			}
			const t1: SolidType = unionOfFloats([4.2, 4.3, 4.4]);
			const t2: SolidType = unionOfFloats([4.3, 4.4, 4.5]);
			const t3: SolidType = unionOfInts([42n, 43n, 44n]);
			const t4: SolidType = unionOfInts([43n, 44n, 45n]);
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
				assert.ok(t.intersect(SolidType.NEVER).equals(SolidType.NEVER), `${ t }`);
			})
		})
		it('1-6 | `T  & unknown == T`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.intersect(SolidType.UNKNOWN).equals(t), `${ t }`);
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
			assert.ok(SolidType.NULL.union(SolidType.BOOL).union(SolidType.INT)
				.intersect(SolidType.BOOL.union(SolidType.INT).union(SolidType.FLOAT))
				.equals(SolidType.BOOL.union(SolidType.INT))
			, `
				(null | bool | int) & (bool | int | float)
				==
				(bool | int)
			`);
		});
		describe('SolidTypeUnion', () => {
			it('distributes union operands over intersection: `(B \| C)  & A == (B  & A) \| (C  & A)`.', () => {
				const expr = SolidType.NULL.union(SolidType.INT).intersect(SolidType.VOID.union(SolidType.NULL).union(SolidBoolean.FALSETYPE));
				assert.ok(expr.equals(SolidType.NULL), `(null | int) & (void | null | false) == null`);
				assert.deepStrictEqual(expr, SolidType.NULL);
			});
		});
	})


	describe('#union', () => {
		it('1-7 | `T \| never   == T`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.union(SolidType.NEVER).equals(t), `${ t }`);
			})
		})
		it('1-8 | `T \| unknown == unknown`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.union(SolidType.UNKNOWN).equals(SolidType.UNKNOWN), `${ t }`);
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
			assert.ok(SolidType.NULL.union(SolidType.BOOL).union(SolidType.INT)
				.union(SolidType.BOOL.union(SolidType.INT).union(SolidType.FLOAT))
				.equals(SolidType.NULL.union(SolidType.BOOL).union(SolidType.INT).union(SolidType.FLOAT))
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
				assert.ok(SolidType.NEVER.isSubtypeOf(t), `${ t }`);
			})
		})
		it('1-2 | `T     <: unknown`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.isSubtypeOf(SolidType.UNKNOWN), `${ t }`);
			})
		})
		it('1-3 | `T       <: never  <->  T == never`', () => {
			builtin_types.forEach((t) => {
				if (t.isSubtypeOf(SolidType.NEVER)) {
					assert.ok(t.equals(SolidType.NEVER), `${ t }`);
				}
			})
		})
		it('1-4 | `unknown <: T      <->  T == unknown`', () => {
			builtin_types.forEach((t) => {
				if (SolidType.UNKNOWN.isSubtypeOf(t)) {
					assert.ok(t.equals(SolidType.UNKNOWN), `${ t }`);
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
				SolidType.NULL.union(SolidType.INT).isSubtypeOf(SolidType.NULL.union(SolidType.INT)) &&
				!SolidType.NULL.union(SolidType.INT).isSubtypeOf(SolidType.NULL) &&
				!SolidType.NULL.union(SolidType.INT).isSubtypeOf(SolidType.INT),
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
				SolidType.NULL.intersect(SolidType.INT).isSubtypeOf(SolidType.NULL.intersect(SolidType.INT)) &&
				!SolidType.NULL.isSubtypeOf(SolidType.NULL.intersect(SolidType.INT)) &&
				!SolidType.INT.isSubtypeOf(SolidType.NULL.intersect(SolidType.INT)),
				'exists A, B, C s.t. `A & B <: C` but `!(A <: C)` and `!(B <: C)`'
			)
		})

		it('discrete types.', () => {
			;[
				SolidType.VOID,
				SolidType.NULL,
				SolidType.BOOL,
				SolidType.INT,
				SolidType.FLOAT,
				SolidType.STR,
			].forEach((t, _, arr) => {
				arr.filter((u) => u !== t).forEach((u) => {
					assert.ok(!u.isSubtypeOf(t), `${ u }, ${ t }`)
				})
			})
		})

		describe('SolidTypeUnit', () => {
			it('unit Boolean types should be subtypes of `bool`.', () => {
				assert.ok(SolidBoolean.FALSETYPE.isSubtypeOf(SolidType.BOOL), 'SolidBoolean.FALSETYPE')
				assert.ok(SolidBoolean.TRUETYPE .isSubtypeOf(SolidType.BOOL), 'SolidBoolean.TRUETYPE')
			})
			it('unit Integer types should be subtypes of `int`.', () => {
				;[42n, -42n, 0n, -0n].map((v) => typeConstInt(v)).forEach((itype) => {
					assert.ok(itype.isSubtypeOf(SolidType.INT), `${ itype }`)
				})
			})
			it('unit Float types should be subtypes of `float`.', () => {
				;[4.2, -4.2e-2, 0.0, -0.0].map((v) => typeConstFloat(v)).forEach((ftype) => {
					assert.ok(ftype.isSubtypeOf(SolidType.FLOAT), `${ ftype }`)
				})
			})
			it('unit String types should be subtypes of `str`.', () => {
				['a4.2', 'b-4.2e-2', 'c0.0', 'd-0.0'].map((v) => typeConstStr(v)).forEach((stype) => {
					assert.ok(stype.isSubtypeOf(SolidType.STR), `${ stype }`);
				});
			});
			it('unit Tuple types should be subtype of a tuple type instance.', () => {
				new Map<SolidObject, SolidTypeTuple>([
					[new SolidTuple(),                                             SolidTypeTuple.fromTypes()],
					[new SolidTuple([new Int16(42n)]),                             SolidTypeTuple.fromTypes([SolidType.INT])],
					[new SolidTuple([new Float64(4.2), new SolidString('hello')]), SolidTypeTuple.fromTypes([SolidType.FLOAT, SolidType.STR])],
				]).forEach((tupletype, value) => {
					assert.ok(new SolidTypeUnit(value).isSubtypeOf(tupletype),  `let x: ${ tupletype } = ${ value };`);
				});
			});
			it('unit Record types should be subtype of a record type instance.', () => {
				new Map<SolidObject, SolidTypeRecord>([
					[new SolidRecord(new Map<bigint, SolidObject>([[0x100n, new Int16(42n)]])),                                       SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([[0x100n, SolidType.INT]]))],
					[new SolidRecord(new Map<bigint, SolidObject>([[0x100n, new Float64(4.2)], [0x101n, new SolidString('hello')]])), SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([[0x100n, SolidType.FLOAT], [0x101n, SolidType.STR]]))],
					[new SolidRecord(new Map<bigint, SolidObject>([[0x100n, new SolidString('hello')], [0x101n, new Float64(4.2)]])), SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([[0x100n, SolidType.STR], [0x101n, SolidType.FLOAT]]))],
				]).forEach((recordtype, value) => {
					assert.ok(new SolidTypeUnit(value).isSubtypeOf(recordtype),  `let x: ${ recordtype } = ${ value };`);
				});
			});
			it('unit List types should be subtype of a list type instance.', () => {
				const input = [
					null,
					[new Int16(42n)],
					[new Float64(4.2), new SolidString('hello')],
				] as const;
				const output: SolidTypeList[] = [
					SolidType.NEVER,
					SolidType.INT,
					SolidType.FLOAT.union(SolidType.STR),
				].map((t) => new SolidTypeList(t));
				new Map<SolidObject, SolidTypeList>([
					[new SolidList(),         output[0]],
					[new SolidList(input[1]), output[1]],
					[new SolidList(input[2]), output[2]],
				]).forEach((listtype, value) => {
					assert.ok(new SolidTypeUnit(value).isSubtypeOf(listtype), `let x: ${ listtype } = ${ value };`);
				});
			});
			it('unit Dict types should be subtype of a dict type instance.', () => {
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
				const output: SolidTypeDict[] = [
					SolidType.INT,
					SolidType.FLOAT.union(SolidType.STR),
					SolidType.STR.union(SolidType.FLOAT),
				].map((t) => new SolidTypeDict(t));
				new Map<SolidObject, SolidTypeDict>([
					[new SolidDict(input[0]), output[0]],
					[new SolidDict(input[1]), output[1]],
					[new SolidDict(input[2]), output[2]],
				]).forEach((dicttype, value) => {
					assert.ok(new SolidTypeUnit(value).isSubtypeOf(dicttype), `let x: ${ dicttype } = ${ value };`);
				});
			});
			it('unit Set types should be subtype of a set type instance.', () => {
				new Map<SolidObject, SolidTypeSet>([
					[new SolidSet(),                                                      new SolidTypeSet(SolidType.NEVER)],
					[new SolidSet(new Set([new Int16(42n)])),                             new SolidTypeSet(SolidType.INT)],
					[new SolidSet(new Set([new Float64(4.2), new SolidString('hello')])), new SolidTypeSet(SolidType.FLOAT.union(SolidType.STR))],
				]).forEach((settype, value) => {
					assert.ok(new SolidTypeUnit(value).isSubtypeOf(settype), `let x: ${ settype } = ${ value };`);
				});
			});
			it('unit Map types should be subtype of a map type instance.', () => {
				new Map<SolidObject, SolidTypeMap>([
					[new SolidMap(new Map<SolidObject, SolidObject>([[new Int16(0x100n), new Int16(42n)]])),                                                  new SolidTypeMap(SolidType.INT, SolidType.INT)],
					[new SolidMap(new Map<SolidObject, SolidObject>([[new Int16(0x100n), new Float64(4.2)], [new Int16(0x101n), new SolidString('hello')]])), new SolidTypeMap(SolidType.INT, SolidType.FLOAT.union(SolidType.STR))],
					[new SolidMap(new Map<SolidObject, SolidObject>([[new SolidString('hello'), new Int16(0x100n)], [new Float64(4.2), new Int16(0x101n)]])), new SolidTypeMap(SolidType.FLOAT.union(SolidType.STR), SolidType.INT)],
				]).forEach((maptype, value) => {
					assert.ok(new SolidTypeUnit(value).isSubtypeOf(maptype), `let x: ${ maptype } = ${ value };`);
				});
			});
		})

		describe('SolidTypeTuple', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(SolidTypeTuple.fromTypes([
					SolidType.INT,
					SolidType.BOOL,
					SolidType.STR,
				]).isSubtypeOf(SolidType.OBJ), `[int, bool, str] <: obj;`);
				assert.ok(!SolidType.OBJ.isSubtypeOf(SolidTypeTuple.fromTypes([
					SolidType.INT,
					SolidType.BOOL,
					SolidType.STR,
				])), `obj !<: [int, bool, str]`);
			});
			it('matches per index.', () => {
				assert.ok(SolidTypeTuple.fromTypes([
					SolidType.INT,
					SolidType.BOOL,
					SolidType.STR,
				]).isSubtypeOf(SolidTypeTuple.fromTypes([
					SolidType.INT.union(SolidType.FLOAT),
					SolidType.BOOL.union(SolidType.NULL),
					SolidType.OBJ,
				])), `[int, bool, str] <: [int | float, bool?, obj];`);
				assert.ok(!SolidTypeTuple.fromTypes([
					SolidType.INT,
					SolidType.BOOL,
					SolidType.STR,
				]).isSubtypeOf(SolidTypeTuple.fromTypes([
					SolidType.BOOL.union(SolidType.NULL),
					SolidType.OBJ,
					SolidType.INT.union(SolidType.FLOAT),
				])), `[int, bool, str] !<: [bool!, obj, int | float];`);
			});
			it('returns false if assigned is smaller than assignee.', () => {
				assert.ok(!SolidTypeTuple.fromTypes([
					SolidType.INT,
					SolidType.BOOL,
				]).isSubtypeOf(SolidTypeTuple.fromTypes([
					SolidType.INT.union(SolidType.FLOAT),
					SolidType.BOOL.union(SolidType.NULL),
					SolidType.OBJ,
				])), `[int, bool] !<: [int | float, bool!, obj];`);
			});
			it('skips rest if assigned is larger than assignee.', () => {
				assert.ok(SolidTypeTuple.fromTypes([
					SolidType.INT,
					SolidType.BOOL,
					SolidType.STR,
				]).isSubtypeOf(SolidTypeTuple.fromTypes([
					SolidType.INT.union(SolidType.FLOAT),
					SolidType.BOOL.union(SolidType.NULL),
				])), `[int, bool, str] <: [int | float, bool!];`);
			});
			it('with optional entries, checks minimum count only.', () => {
				assert.ok(new SolidTypeTuple([
					{type: SolidType.INT, optional: false},
					{type: SolidType.INT, optional: false},
					{type: SolidType.INT, optional: true},
					{type: SolidType.INT, optional: true},
				]).isSubtypeOf(new SolidTypeTuple([
					{type: SolidType.INT, optional: false},
					{type: SolidType.INT, optional: true},
					{type: SolidType.INT, optional: true},
					{type: SolidType.INT, optional: true},
					{type: SolidType.INT, optional: true},
				])), `[int, int, ?:int, ?:int] <: [int, ?:int, ?:int, ?:int, ?:int]`);
				assert.ok(!new SolidTypeTuple([
					{type: SolidType.INT, optional: false},
					{type: SolidType.INT, optional: true},
					{type: SolidType.INT, optional: true},
					{type: SolidType.INT, optional: true},
					{type: SolidType.INT, optional: true},
				]).isSubtypeOf(new SolidTypeTuple([
					{type: SolidType.INT, optional: false},
					{type: SolidType.INT, optional: false},
					{type: SolidType.INT, optional: true},
					{type: SolidType.INT, optional: true},
				])), `[int, ?:int, ?:int, ?:int, ?:int] !<: [int, int, ?:int, ?:int]`);
			});
			it('Invariance for mutable tuples: `A == B --> mutable Tuple.<A> <: mutable Tuple.<B>`.', () => {
				assert.ok(!SolidTypeTuple.fromTypes([SolidType.INT, SolidType.FLOAT], true).isSubtypeOf(SolidTypeTuple.fromTypes([SolidType.INT.union(SolidType.NULL), SolidType.FLOAT.union(SolidType.NULL)], true)), `mutable [int, float] !<: mutable [int?, float?]`);
			});
			it('is not a subtype of List', () => {
				return assert.ok(!SolidTypeTuple.fromTypes([SolidType.INT], true).isSubtypeOf(new SolidTypeList(SolidType.INT, true)), `mutable [int] !<: mutable int[]`);
			});
		});

		describe('SolidTypeRecord', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, SolidType.INT],
					[0x101n, SolidType.BOOL],
					[0x102n, SolidType.STR],
				])).isSubtypeOf(SolidType.OBJ), `[x: int, y: bool, z: str] <: obj;`);
				assert.ok(!SolidType.OBJ.isSubtypeOf(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, SolidType.INT],
					[0x101n, SolidType.BOOL],
					[0x102n, SolidType.STR],
				]))), `obj !<: [x: int, y: bool, z: str]`);
			});
			it('matches per key.', () => {
				assert.ok(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, SolidType.INT],
					[0x101n, SolidType.BOOL],
					[0x102n, SolidType.STR],
				])).isSubtypeOf(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x101n, SolidType.BOOL.union(SolidType.NULL)],
					[0x102n, SolidType.OBJ],
					[0x100n, SolidType.INT.union(SolidType.FLOAT)],
				]))), `[x: int, y: bool, z: str] <: [y: bool!, z: obj, x: int | float];`);
				assert.ok(!SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, SolidType.INT],
					[0x101n, SolidType.BOOL],
					[0x102n, SolidType.STR],
				])).isSubtypeOf(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, SolidType.BOOL.union(SolidType.NULL)],
					[0x101n, SolidType.OBJ],
					[0x102n, SolidType.INT.union(SolidType.FLOAT)],
				]))), `[x: int, y: bool, z: str] !<: [x: bool!, y: obj, z: int | float];`);
			});
			it('returns false if assigned is smaller than assignee.', () => {
				assert.ok(!SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, SolidType.INT],
					[0x101n, SolidType.BOOL],
				])).isSubtypeOf(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x101n, SolidType.BOOL.union(SolidType.NULL)],
					[0x102n, SolidType.OBJ],
					[0x100n, SolidType.INT.union(SolidType.FLOAT)],
				]))), `[x: int, y: bool] !<: [y: bool!, z: obj, x: int | float];`);
			});
			it('skips rest if assigned is larger than assignee.', () => {
				assert.ok(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, SolidType.INT],
					[0x101n, SolidType.BOOL],
					[0x102n, SolidType.STR],
				])).isSubtypeOf(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x101n, SolidType.BOOL.union(SolidType.NULL)],
					[0x100n, SolidType.INT.union(SolidType.FLOAT)],
				]))), `[x: int, y: bool, z: str] <: [y: bool!, x: int | float];`);
			});
			it('returns false if assignee contains keys that assigned does not.', () => {
				assert.ok(!SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, SolidType.INT],
					[0x101n, SolidType.BOOL],
					[0x102n, SolidType.STR],
				])).isSubtypeOf(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x101n, SolidType.BOOL.union(SolidType.NULL)],
					[0x102n, SolidType.OBJ],
					[0x103n, SolidType.INT.union(SolidType.FLOAT)],
				]))), `[x: int, y: bool, z: str] !<: [y: bool!, z: obj, w: int | float]`);
			});
			it('optional entries are not assignable to required entries.', () => {
				assert.ok(new SolidTypeRecord(new Map<bigint, TypeEntry>([
					[0x100n, {type: SolidType.STR,  optional: false}],
					[0x101n, {type: SolidType.INT,  optional: true}],
					[0x102n, {type: SolidType.BOOL, optional: false}],
				])).isSubtypeOf(new SolidTypeRecord(new Map<bigint, TypeEntry>([
					[0x100n, {type: SolidType.STR,  optional: true}],
					[0x101n, {type: SolidType.INT,  optional: true}],
					[0x102n, {type: SolidType.BOOL, optional: false}],
				]))), `[a: str, b?: int, c: bool] <: [a?: str, b?: int, c: bool]`);
				assert.ok(!new SolidTypeRecord(new Map<bigint, TypeEntry>([
					[0x100n, {type: SolidType.STR,  optional: false}],
					[0x101n, {type: SolidType.INT,  optional: true}],
					[0x102n, {type: SolidType.BOOL, optional: false}],
				])).isSubtypeOf(new SolidTypeRecord(new Map<bigint, TypeEntry>([
					[0x100n, {type: SolidType.STR,  optional: true}],
					[0x101n, {type: SolidType.INT,  optional: false}],
					[0x102n, {type: SolidType.BOOL, optional: false}],
				]))), `[a: str, b?: int, c: bool] !<: [a?: str, b: int, c: bool]`);
			});
			it('Invariance for mutable records: `A == B --> mutable Record.<A> <: mutable Record.<B>`.', () => {
				assert.ok(!SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, SolidType.INT],
					[0x101n, SolidType.FLOAT],
				]), true).isSubtypeOf(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, SolidType.INT.union(SolidType.NULL)],
					[0x101n, SolidType.FLOAT.union(SolidType.NULL)],
				]), true)), `mutable [a: int, b: float] !<: mutable [a: int?, b: float?]`);
			});
			it('is not a subtype of Dict', () => {
				return assert.ok(!SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, SolidType.INT],
				]), true).isSubtypeOf(new SolidTypeDict(SolidType.INT, true)), `mutable [a: int] !<: mutable [: int]`);
			});
		});

		describe('SolidTypeList', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(new SolidTypeList(SolidType.INT.union(SolidType.BOOL)).isSubtypeOf(SolidType.OBJ), `List.<int | bool> <: obj;`);
				assert.ok(!SolidType.OBJ.isSubtypeOf(new SolidTypeList(SolidType.INT.union(SolidType.BOOL))), `obj !<: List.<int | bool>`);
			});
			it('Covariance for immutable lists: `A <: B --> List.<A> <: List.<B>`.', () => {
				assert.ok(new SolidTypeList(SolidType.INT).isSubtypeOf(new SolidTypeList(SolidType.INT.union(SolidType.FLOAT))), `List.<int> <: List.<int | float>`);
				assert.ok(!new SolidTypeList(SolidType.INT.union(SolidType.FLOAT)).isSubtypeOf(new SolidTypeList(SolidType.INT)), `List.<int | float> !<: List.<int>`);
			});
			it('Invariance for mutable lists: `A == B --> mutable List.<A> <: mutable List.<B>`.', () => {
				assert.ok(!new SolidTypeList(SolidType.INT, true).isSubtypeOf(new SolidTypeList(SolidType.INT.union(SolidType.FLOAT), true)), `mutable List.<int> !<: mutable List.<int | float>`);
			});
		});

		describe('SolidTypeDict', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(new SolidTypeDict(SolidType.INT.union(SolidType.BOOL)).isSubtypeOf(SolidType.OBJ), `Dict.<int | bool> <: obj;`);
				assert.ok(!SolidType.OBJ.isSubtypeOf(new SolidTypeDict(SolidType.INT.union(SolidType.BOOL))), `obj !<: Dict.<int | bool>`);
			});
			it('Covariance for immutable dicts: `A <: B --> Dict.<A> <: Dict.<B>`.', () => {
				assert.ok(new SolidTypeDict(SolidType.INT).isSubtypeOf(new SolidTypeDict(SolidType.INT.union(SolidType.FLOAT))), `Dict.<int> <: Dict.<int | float>`);
				assert.ok(!new SolidTypeDict(SolidType.INT.union(SolidType.FLOAT)).isSubtypeOf(new SolidTypeDict(SolidType.INT)), `Dict.<int | float> !<: Dict.<int>`);
			});
			it('Invariance for mutable dicts: `A == B --> mutable Dict.<A> <: mutable Dict.<B>`.', () => {
				assert.ok(!new SolidTypeDict(SolidType.INT, true).isSubtypeOf(new SolidTypeDict(SolidType.INT.union(SolidType.FLOAT), true)), `mutable Dict.<int> !<: mutable Dict.<int | float>`);
			});
		});

		describe('SolidTypeSet', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(new SolidTypeSet(SolidType.INT).isSubtypeOf(SolidType.OBJ), `Set.<int> <: obj`);
				assert.ok(!SolidType.OBJ.isSubtypeOf(new SolidTypeSet(SolidType.INT)), `obj !<: Set.<int>`);
			});
			it('Covariance or immutable sets: `A <: B --> Set.<A> <: Set.<B>`.', () => {
				assert.ok(new SolidTypeSet(SolidType.INT).isSubtypeOf(new SolidTypeSet(SolidType.INT.union(SolidType.FLOAT))), `Set.<int> <: Set.<int | float>`);
				assert.ok(!new SolidTypeSet(SolidType.INT.union(SolidType.FLOAT)).isSubtypeOf(new SolidTypeSet(SolidType.INT)), `Set.<int | float> !<: Set.<int>`);
			});
			it('Invariance for mutable sets: `A == B --> mutable Set.<A> <: mutable Set.<B>`.', () => {
				assert.ok(!new SolidTypeSet(SolidType.INT, true).isSubtypeOf(new SolidTypeSet(SolidType.INT.union(SolidType.FLOAT), true)), `mutable Set.<int> !<: mutable Set.<int | float>`);
			});
		});

		describe('SolidTypeMap', () => {
			it('is a subtype but not a supertype of `obj`.', () => {
				assert.ok(new SolidTypeMap(SolidType.INT, SolidType.BOOL).isSubtypeOf(SolidType.OBJ), `Map.<int, bool> <: obj`);
				assert.ok(!SolidType.OBJ.isSubtypeOf(new SolidTypeMap(SolidType.INT, SolidType.BOOL)), `obj !<: Map.<int, bool>`);
			});
			it('Covariance for immutable maps: `A <: C && B <: D --> Map.<A, B> <: Map.<C, D>`.', () => {
				assert.ok(new SolidTypeMap(SolidType.INT, SolidType.BOOL).isSubtypeOf(new SolidTypeMap(SolidType.INT.union(SolidType.FLOAT), SolidType.BOOL.union(SolidType.NULL))), `Map.<int, bool> <: Map.<int | float, bool | null>`);
				assert.ok(!new SolidTypeMap(SolidType.INT.union(SolidType.FLOAT), SolidType.BOOL.union(SolidType.NULL)).isSubtypeOf(new SolidTypeMap(SolidType.INT, SolidType.BOOL)), `Map.<int | float, bool | null> !<: Map.<int, bool>`);
			});
			it('Invariance for mutable maps: `A == C && B == D --> mutable Map.<A, B> <: mutable Map.<C, D>`.', () => {
				assert.ok(!new SolidTypeMap(SolidType.INT, SolidType.BOOL, true).isSubtypeOf(new SolidTypeMap(SolidType.INT.union(SolidType.FLOAT), SolidType.BOOL.union(SolidType.NULL), true)), `mutable Map.<int, bool> !<: mutable Map.<int | float, bool | null>`);
			});
		});

		describe('SolidTypeInterface', () => {
			it('returns `true` if the subtype contains at least the properties of the supertype.', () => {
				assert.ok(!t0.isSubtypeOf(t1))
				assert.ok(!t1.isSubtypeOf(t0))
				assert.ok(new SolidTypeInterface(new Map<string, SolidType>([
					['foo', SolidType.STR],
					['bar', SolidType.NULL],
					['diz', SolidType.BOOL],
					['qux', SolidType.INT.union(SolidType.FLOAT)],
				])).isSubtypeOf(t0))
			})
		})
	})


	describe('#mutableOf', () => {
		it('mutable types are subtypes of their immutable counterparts.', () => {
			[
				...builtin_types,
				SolidTypeTuple.fromTypes([
					SolidType.INT,
					SolidType.FLOAT,
					SolidType.STR,
				]),
				SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, SolidType.INT],
					[0x101n, SolidType.FLOAT],
					[0x102n, SolidType.STR],
				])),
				new SolidTypeList(SolidType.BOOL),
				new SolidTypeDict(SolidType.BOOL),
				new SolidTypeSet(SolidType.NULL),
				new SolidTypeMap(SolidType.INT, SolidType.FLOAT),
			].forEach((t) => {
				assert.ok(t.mutableOf().isSubtypeOf(t), `mutable ${ t } <: ${ t }`);
			});
		});
		it('non-constant mutable types are not equal to their immutable counterparts.', () => {
			[
				SolidTypeTuple.fromTypes([
					SolidType.INT,
					SolidType.FLOAT,
					SolidType.STR,
				]),
				SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, SolidType.INT],
					[0x101n, SolidType.FLOAT],
					[0x102n, SolidType.STR],
				])),
				new SolidTypeList(SolidType.BOOL),
				new SolidTypeDict(SolidType.BOOL),
				new SolidTypeSet(SolidType.NULL),
				new SolidTypeMap(SolidType.INT, SolidType.FLOAT),
			].forEach((t) => {
				assert.ok(!t.mutableOf().equals(t), `mutable ${ t } != ${ t }`);
			});
		});
		it('non-constant immutable types are not subtypes of their mutable counterparts.', () => {
			[
				SolidTypeTuple.fromTypes([
					SolidType.INT,
					SolidType.FLOAT,
					SolidType.STR,
				]),
				SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, SolidType.INT],
					[0x101n, SolidType.FLOAT],
					[0x102n, SolidType.STR],
				])),
				new SolidTypeList(SolidType.BOOL),
				new SolidTypeDict(SolidType.BOOL),
				new SolidTypeSet(SolidType.NULL),
				new SolidTypeMap(SolidType.INT, SolidType.FLOAT),
			].forEach((t) => {
				assert.ok(!t.isSubtypeOf(t.mutableOf()), `${ t } !<: mutable ${ t }`);
			});
		});
		context('disributes over binary operations.', () => {
			const types: SolidType[] = [
				SolidType.NEVER,
				SolidType.UNKNOWN,
				SolidType.VOID,
				SolidType.OBJ,
				SolidType.NULL,
				SolidType.BOOL,
				SolidType.INT,
				SolidType.FLOAT,
				SolidType.STR,
				SolidTypeTuple.fromTypes([
					SolidType.INT,
					SolidType.FLOAT,
					SolidType.STR,
				]),
				SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, SolidType.INT],
					[0x101n, SolidType.FLOAT],
					[0x102n, SolidType.STR],
				])),
				new SolidTypeList(SolidType.BOOL),
				new SolidTypeDict(SolidType.BOOL),
				new SolidTypeSet(SolidType.NULL),
				new SolidTypeMap(SolidType.INT, SolidType.FLOAT),
			];
			specify('mutable (A - B) == mutable A - mutable B', () => {
				predicate2(types, (a, b) => {
					const difference: SolidType = a.subtract(b).mutableOf();
					assert.ok(difference.equals(a.mutableOf().subtract(b.mutableOf())), `${ a }, ${ b }`);
					if (difference instanceof SolidTypeDifference) {
						assert.ok(!difference.isMutable, 'SolidTypeDifference#isMutable === false');
					}
				});
			});
			specify('mutable (A & B) == mutable A & mutable B', () => {
				predicate2(types, (a, b) => {
					const intersection: SolidType = a.intersect(b).mutableOf();
					assert.ok(intersection.equals(a.mutableOf().intersect(b.mutableOf())), `${ a }, ${ b }`);
					if (intersection instanceof SolidTypeIntersection) {
						assert.ok(!intersection.isMutable, 'SolidTypeIntersection#isMutable === false');
					}
				});
			});
			specify('mutable (A | B) == mutable A | mutable B', () => {
				predicate2(types, (a, b) => {
					const union: SolidType = a.union(b).mutableOf();
					assert.ok(union.equals(a.mutableOf().union(b.mutableOf())), `${ a }, ${ b }`);
					if (union instanceof SolidTypeUnion) {
						assert.ok(!union.isMutable, 'SolidTypeUnion#isMutable === false');
					}
				});
			});
		});
	});


	describe('#binType', () => {
		it('returns a binaryen type for simple types.', () => {
			const tests = new Map<SolidType, binaryen.Type>([
				[SolidType.NEVER, binaryen.unreachable],
				[SolidType.VOID,  binaryen.none],
				[SolidType.NULL,  binaryen.funcref],
				[SolidType.BOOL,  binaryen.i32],
				[SolidType.INT,   binaryen.i32],
				[SolidType.FLOAT, binaryen.f64],
			]);
			return assert.deepStrictEqual([...tests.keys()].map((t) => t.binType()), [...tests.values()]);
		});
		it('returns tuple types for unions.', () => {
			const tests = new Map<SolidType, binaryen.Type>([
				[SolidType.NULL.union(SolidType.BOOL),  BinEither.createType(binaryen.funcref, binaryen.i32)],
				[SolidType.BOOL.union(SolidType.INT),   BinEither.createType(binaryen.i32,     binaryen.i32)],
				[SolidType.NULL.union(SolidType.INT),   BinEither.createType(binaryen.funcref, binaryen.i32)],
				[SolidType.VOID.union(SolidType.NULL),  BinEither.createType(binaryen.i32,     binaryen.funcref)],
				[SolidType.VOID.union(SolidType.BOOL),  BinEither.createType(binaryen.i32,     binaryen.i32)],
				[SolidType.VOID.union(SolidType.INT),   BinEither.createType(binaryen.i32,     binaryen.i32)],
				[SolidType.VOID.union(SolidType.FLOAT), BinEither.createType(binaryen.f64,     binaryen.f64)],
				[SolidType.NULL.union(SolidType.FLOAT), BinEither.createType(binaryen.funcref, binaryen.f64)],
				[SolidType.BOOL.union(SolidType.FLOAT), BinEither.createType(binaryen.i32,     binaryen.f64)],
				[SolidType.INT .union(SolidType.FLOAT), BinEither.createType(binaryen.i32,     binaryen.f64)],
			]);
			return assert.deepStrictEqual([...tests.keys()].map((t) => t.binType()), [...tests.values()]);
		});
	});


	describe('SolidTypeIntersection', () => {
		describe('#combineTuplesOrRecords', () => {
			context('with tuple operands.', () => {
				it('takes the union of indices of constituent types.', () => {
					assert.ok(SolidTypeTuple.fromTypes([
						SolidType.OBJ,
						SolidType.NULL,
						SolidType.BOOL,
					]).intersectWithTuple(SolidTypeTuple.fromTypes([
						SolidType.OBJ,
						SolidType.INT,
					])).equals(SolidTypeTuple.fromTypes([
						SolidType.OBJ,
						SolidType.NULL.intersect(SolidType.INT),
						SolidType.BOOL,
					])), `
						[obj, null, bool] & [obj, int]
						==
						[obj, null & int, bool]
					`);
				});
				it('takes the conjunction of optionality.', () => {
					assert.ok(new SolidTypeTuple([
						{type: SolidType.OBJ,  optional: false},
						{type: SolidType.NULL, optional: true},
						{type: SolidType.BOOL, optional: true},
					]).intersectWithTuple(new SolidTypeTuple([
						{type: SolidType.OBJ,   optional: false},
						{type: SolidType.INT,   optional: false},
						{type: SolidType.FLOAT, optional: true},
					])).equals(new SolidTypeTuple([
						{type: SolidType.OBJ,                             optional: false},
						{type: SolidType.NULL.intersect(SolidType.INT),   optional: false},
						{type: SolidType.BOOL.intersect(SolidType.FLOAT), optional: true},
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
					assert.ok(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
						[foo, SolidType.OBJ],
						[bar, SolidType.NULL],
						[qux, SolidType.BOOL],
					])).intersectWithRecord(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
						[foo, SolidType.OBJ],
						[diz, SolidType.INT],
						[qux, SolidType.STR],
					]))).equals(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
						[foo, SolidType.OBJ],
						[bar, SolidType.NULL],
						[qux, SolidType.BOOL.intersect(SolidType.STR)],
						[diz, SolidType.INT],
					]))), `
						[foo: obj, bar: null, qux: bool] & [foo: obj, diz: int, qux: str]
						==
						[foo: obj, bar: null, qux: bool & str, diz: int]
					`);
				})
				it('takes the conjunction of optionality.', () => {
					const [foo, bar, qux, diz] = [0x100n, 0x101n, 0x102n, 0x103n];
					assert.ok(new SolidTypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: SolidType.OBJ,  optional: false}],
						[bar, {type: SolidType.NULL, optional: true}],
						[qux, {type: SolidType.BOOL, optional: true}],
					])).intersectWithRecord(new SolidTypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: SolidType.OBJ, optional: false}],
						[diz, {type: SolidType.INT, optional: true}],
						[qux, {type: SolidType.STR, optional: false}],
					]))).equals(new SolidTypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: SolidType.OBJ,                           optional: false}],
						[bar, {type: SolidType.NULL,                          optional: true}],
						[qux, {type: SolidType.BOOL.intersect(SolidType.STR), optional: false}],
						[diz, {type: SolidType.INT,                           optional: true}],
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
					assert.ok(SolidTypeTuple.fromTypes([
						SolidType.OBJ,
						SolidType.NULL,
						SolidType.BOOL,
					]).unionWithTuple(SolidTypeTuple.fromTypes([
						SolidType.OBJ,
						SolidType.INT,
					])).equals(SolidTypeTuple.fromTypes([
						SolidType.OBJ,
						SolidType.NULL.union(SolidType.INT),
					])), `
						[obj, null, bool] | [obj, int]
						==
						[obj, null | int]
					`);
				});
				it('takes the disjunction of optionality.', () => {
					assert.ok(new SolidTypeTuple([
						{type: SolidType.OBJ,  optional: false},
						{type: SolidType.NULL, optional: true},
						{type: SolidType.BOOL, optional: true},
					]).unionWithTuple(new SolidTypeTuple([
						{type: SolidType.OBJ,   optional: false},
						{type: SolidType.INT,   optional: false},
						{type: SolidType.FLOAT, optional: true},
					])).equals(new SolidTypeTuple([
						{type: SolidType.OBJ,                         optional: false},
						{type: SolidType.NULL.union(SolidType.INT),   optional: true},
						{type: SolidType.BOOL.union(SolidType.FLOAT), optional: true},
					])), `
						[obj, ?: null, ?: bool] | [obj, int, ?: float]
						==
						[obj, ?: null | int, ?: bool | float]
					`);
				});
				it('some value assignable to combo type might not be assignable to union.', () => {
					const left: SolidTypeTuple = SolidTypeTuple.fromTypes([
						SolidType.BOOL,
						SolidType.INT,
					]);
					const right: SolidTypeTuple = SolidTypeTuple.fromTypes([
						SolidType.INT,
						SolidType.BOOL,
					]);
					const union: SolidType = left.union(right);
					assert.ok(union instanceof SolidTypeUnion);
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
					assert.ok(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
						[foo, SolidType.OBJ],
						[bar, SolidType.NULL],
						[qux, SolidType.BOOL],
					])).unionWithRecord(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
						[foo, SolidType.OBJ],
						[diz, SolidType.INT],
						[qux, SolidType.STR],
					]))).equals(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
						[foo, SolidType.OBJ],
						[qux, SolidType.BOOL.union(SolidType.STR)],
					]))), `
						[foo: obj, bar: null, qux: bool] | [foo: obj, diz: int, qux: str]
						==
						[foo: obj, qux: bool | str]
					`);
				});
				it('takes the disjunction of optionality.', () => {
					const [foo, bar, qux, diz] = [0x100n, 0x101n, 0x102n, 0x103n];
					assert.ok(new SolidTypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: SolidType.OBJ,  optional: false}],
						[bar, {type: SolidType.NULL, optional: true}],
						[qux, {type: SolidType.BOOL, optional: true}],
					])).unionWithRecord(new SolidTypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: SolidType.OBJ, optional: false}],
						[diz, {type: SolidType.INT, optional: true}],
						[qux, {type: SolidType.STR, optional: false}],
					]))).equals(new SolidTypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: SolidType.OBJ,                       optional: false}],
						[qux, {type: SolidType.BOOL.union(SolidType.STR), optional: true}],
					]))), `
						[foo: obj, bar?: null, qux?: bool] | [foo: obj, diz?: int, qux: str]
						==
						[foo: obj, qux?: bool | str]
					`);
				});
				it('some value assignable to combo type might not be assignable to union.', () => {
					const left: SolidTypeRecord = SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
						[0x100n, SolidType.BOOL],
						[0x101n, SolidType.INT],
						[0x102n, SolidType.STR],
					]));
					const right: SolidTypeRecord = SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
						[0x103n, SolidType.STR],
						[0x100n, SolidType.INT],
						[0x101n, SolidType.BOOL],
					]));
					const union: SolidType = left.union(right);
					assert.ok(union instanceof SolidTypeUnion);
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
