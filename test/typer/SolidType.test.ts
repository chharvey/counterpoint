import * as assert from 'assert'
import {Dev} from '../../src/core/index.js';
import {
	TypeEntry,
	SolidType,
	SolidTypeUnion,
	SolidTypeConstant,
	SolidTypeInterface,
	SolidTypeTuple,
	SolidTypeRecord,
	SolidTypeMapping,
	SolidObject,
	SolidNull,
	SolidBoolean,
	SolidNumber,
	Int16,
	Float64,
	SolidString,
	SolidTuple,
	SolidRecord,
	SolidMapping,
} from '../../src/typer/index.js';
import {
	typeConstInt,
	typeConstFloat,
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
		SolidObject,
		SolidNull,
		SolidBoolean,
		Int16,
		Float64,
		SolidString,
		SolidTuple,
		SolidRecord,
		SolidMapping,
	]
	const t0: SolidTypeInterface = new SolidTypeInterface(new Map<string, SolidType>([
		['foo', SolidObject],
		['bar', SolidNull],
		['diz', SolidBoolean],
	]))
	const t1: SolidTypeInterface = new SolidTypeInterface(new Map<string, SolidType>([
		['foo', SolidObject],
		['qux', SolidNumber],
		['diz', SolidString],
	]))


	describe('#includes', () => {
		it('uses `SolidObject#identical` to compare values.', () => {
			function unionOfInts(fs: bigint[]): SolidType {
				return fs.map<SolidType>(typeConstInt).reduce((a, b) => a.union(b));
			}
			function unionOfFloats(fs: number[]): SolidType {
				return fs.map<SolidType>(typeConstFloat).reduce((a, b) => a.union(b));
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
			assert.ok(SolidNull.union(SolidBoolean).union(Int16)
				.intersect(SolidBoolean.union(Int16).union(Float64))
				.equals(SolidBoolean.union(Int16))
			, `
				(null | bool | int) & (bool | int | float)
				==
				(bool | int)
			`);
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
			assert.ok(SolidNull.union(SolidBoolean).union(Int16)
				.union(SolidBoolean.union(Int16).union(Float64))
				.equals(SolidNull.union(SolidBoolean).union(Int16).union(Float64))
			, `
				(null | bool | int) | (bool | int | float)
				==
				(null | bool | int | float)
			`);
		});
	})


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
				SolidNull.union(Int16).isSubtypeOf(SolidNull.union(Int16)) &&
				!SolidNull.union(Int16).isSubtypeOf(SolidNull) &&
				!SolidNull.union(Int16).isSubtypeOf(Int16),
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
				SolidNull.intersect(Int16).isSubtypeOf(SolidNull.intersect(Int16)) &&
				!SolidNull.isSubtypeOf(SolidNull.intersect(Int16)) &&
				!Int16.isSubtypeOf(SolidNull.intersect(Int16)),
				'exists A, B, C s.t. `A & B <: C` but `!(A <: C)` and `!(B <: C)`'
			)
		})

		it('discrete types.', () => {
			;[
				SolidType.VOID,
				SolidNull,
				SolidBoolean,
				Int16,
				Float64,
				SolidString,
				SolidTuple,
				SolidRecord,
				SolidMapping,
			].forEach((t, _, arr) => {
				arr.filter((u) => u !== t).forEach((u) => {
					assert.ok(!u.isSubtypeOf(t), `${ u }, ${ t }`)
				})
			})
		})

		describe('SolidTypeConstant', () => {
			it('constant Boolean types should be subtypes of `bool`.', () => {
				assert.ok(SolidBoolean.FALSETYPE.isSubtypeOf(SolidBoolean), 'SolidBoolean.FALSETYPE')
				assert.ok(SolidBoolean.TRUETYPE .isSubtypeOf(SolidBoolean), 'SolidBoolean.TRUETYPE')
			})
			it('constant Integer types should be subtypes of `int`.', () => {
				;[42n, -42n, 0n, -0n].map((v) => new SolidTypeConstant(new Int16(v))).forEach((itype) => {
					assert.ok(itype.isSubtypeOf(Int16), `${ itype }`)
				})
			})
			it('constant Float types should be subtypes of `float`.', () => {
				;[4.2, -4.2e-2, 0.0, -0.0].map((v) => new SolidTypeConstant(new Float64(v))).forEach((ftype) => {
					assert.ok(ftype.isSubtypeOf(Float64), `${ ftype }`)
				})
			})
			it('constant String types should be subtypes of `str`.', () => {
				['a4.2', 'b-4.2e-2', 'c0.0', 'd-0.0'].map((v) => new SolidTypeConstant(new SolidString(v))).forEach((stype) => {
					assert.ok(stype.isSubtypeOf(SolidString), `${ stype }`);
				});
			});
			it('constant tuple types should be subtype of a tuple type instance.', () => {
				new Map<SolidObject, SolidTypeTuple>([
					[new SolidTuple(),                                             SolidTypeTuple.fromTypes()],
					[new SolidTuple([new Int16(42n)]),                             SolidTypeTuple.fromTypes([Int16])],
					[new SolidTuple([new Float64(4.2), new SolidString('hello')]), SolidTypeTuple.fromTypes([Float64, SolidString])],
				]).forEach((tupletype, value) => {
					assert.ok(new SolidTypeConstant(value).isSubtypeOf(SolidTuple), `let x: Tuple = ${ value };`);
					assert.ok(new SolidTypeConstant(value).isSubtypeOf(tupletype),  `let x: ${ tupletype } = ${ value };`);
				});
			});
			it('constant record types should be subtype of a record type instance.', () => {
				new Map<SolidObject, SolidTypeRecord>([
					[new SolidRecord(new Map<bigint, SolidObject>([[0x100n, new Int16(42n)]])),                                       SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([[0x100n, Int16]]))],
					[new SolidRecord(new Map<bigint, SolidObject>([[0x100n, new Float64(4.2)], [0x101n, new SolidString('hello')]])), SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([[0x100n, Float64], [0x101n, SolidString]]))],
					[new SolidRecord(new Map<bigint, SolidObject>([[0x100n, new SolidString('hello')], [0x101n, new Float64(4.2)]])), SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([[0x100n, SolidString], [0x101n, Float64]]))],
				]).forEach((recordtype, value) => {
					assert.ok(new SolidTypeConstant(value).isSubtypeOf(SolidRecord), `let x: Record = ${ value };`);
					assert.ok(new SolidTypeConstant(value).isSubtypeOf(recordtype),  `let x: ${ recordtype } = ${ value };`);
				});
			});
			it('constant mapping types should be subtype of a mapping type instance.', () => {
				new Map<SolidObject, SolidTypeMapping>([
					[new SolidMapping(new Map<SolidObject, SolidObject>([[new Int16(0x100n), new Int16(42n)]])),                                                  new SolidTypeMapping(Int16, Int16)],
					[new SolidMapping(new Map<SolidObject, SolidObject>([[new Int16(0x100n), new Float64(4.2)], [new Int16(0x101n), new SolidString('hello')]])), new SolidTypeMapping(Int16, Float64.union(SolidString))],
					[new SolidMapping(new Map<SolidObject, SolidObject>([[new SolidString('hello'), new Int16(0x100n)], [new Float64(4.2), new Int16(0x101n)]])), new SolidTypeMapping(Float64.union(SolidString), Int16)],
				]).forEach((mappingtype, value) => {
					assert.ok(new SolidTypeConstant(value).isSubtypeOf(SolidMapping), `let x: Record = ${ value };`);
					assert.ok(new SolidTypeConstant(value).isSubtypeOf(mappingtype),  `let x: ${ mappingtype } = ${ value };`);
				});
			});
		})

		Dev.supports('literalCollection') && describe('SolidTypeTuple', () => {
			it('is a subtype but not a supertype of `SolidObject`.', () => {
				assert.ok(SolidTypeTuple.fromTypes([
					Int16,
					SolidBoolean,
					SolidString,
				]).isSubtypeOf(SolidObject), `[int, bool, str] <: obj;`);
				assert.ok(!SolidObject.isSubtypeOf(SolidTypeTuple.fromTypes([
					Int16,
					SolidBoolean,
					SolidString,
				])), `obj !<: [int, bool, str]`);
			});
			it('matches per index.', () => {
				assert.ok(SolidTypeTuple.fromTypes([
					Int16,
					SolidBoolean,
					SolidString,
				]).isSubtypeOf(SolidTypeTuple.fromTypes([
					Int16.union(Float64),
					SolidBoolean.union(SolidNull),
					SolidObject,
				])), `[int, bool, str] <: [int | float, bool!, obj];`);
				assert.ok(!SolidTypeTuple.fromTypes([
					Int16,
					SolidBoolean,
					SolidString,
				]).isSubtypeOf(SolidTypeTuple.fromTypes([
					SolidBoolean.union(SolidNull),
					SolidObject,
					Int16.union(Float64),
				])), `[int, bool, str] !<: [bool!, obj, int | float];`);
			});
			it('returns false if assigned is smaller than assignee.', () => {
				assert.ok(!SolidTypeTuple.fromTypes([
					Int16,
					SolidBoolean,
				]).isSubtypeOf(SolidTypeTuple.fromTypes([
					Int16.union(Float64),
					SolidBoolean.union(SolidNull),
					SolidObject,
				])), `[int, bool] !<: [int | float, bool!, obj];`);
			});
			it('skips rest if assigned is larger than assignee.', () => {
				assert.ok(SolidTypeTuple.fromTypes([
					Int16,
					SolidBoolean,
					SolidString,
				]).isSubtypeOf(SolidTypeTuple.fromTypes([
					Int16.union(Float64),
					SolidBoolean.union(SolidNull),
				])), `[int, bool, str] <: [int | float, bool!];`);
			});
			Dev.supports('optionalEntries') && it('with optional entries, checks minimum count only.', () => {
				assert.ok(new SolidTypeTuple([
					{type: Int16, optional: false},
					{type: Int16, optional: false},
					{type: Int16, optional: true},
					{type: Int16, optional: true},
				]).isSubtypeOf(new SolidTypeTuple([
					{type: Int16, optional: false},
					{type: Int16, optional: true},
					{type: Int16, optional: true},
					{type: Int16, optional: true},
					{type: Int16, optional: true},
				])), `[int, int, ?:int, ?:int] <: [int, ?:int, ?:int, ?:int, ?:int]`);
				assert.ok(!new SolidTypeTuple([
					{type: Int16, optional: false},
					{type: Int16, optional: true},
					{type: Int16, optional: true},
					{type: Int16, optional: true},
					{type: Int16, optional: true},
				]).isSubtypeOf(new SolidTypeTuple([
					{type: Int16, optional: false},
					{type: Int16, optional: false},
					{type: Int16, optional: true},
					{type: Int16, optional: true},
				])), `[int, ?:int, ?:int, ?:int, ?:int] !<: [int, int, ?:int, ?:int]`);
			});
		});

		Dev.supports('literalCollection') && describe('SolidTypeRecord', () => {
			it('is a subtype but not a supertype of `SolidObject`.', () => {
				assert.ok(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, Int16],
					[0x101n, SolidBoolean],
					[0x102n, SolidString],
				])).isSubtypeOf(SolidObject), `[x: int, y: bool, z: str] <: obj;`);
				assert.ok(!SolidObject.isSubtypeOf(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, Int16],
					[0x101n, SolidBoolean],
					[0x102n, SolidString],
				]))), `obj !<: [x: int, y: bool, z: str]`);
			});
			it('matches per key.', () => {
				assert.ok(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, Int16],
					[0x101n, SolidBoolean],
					[0x102n, SolidString],
				])).isSubtypeOf(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x101n, SolidBoolean.union(SolidNull)],
					[0x102n, SolidObject],
					[0x100n, Int16.union(Float64)],
				]))), `[x: int, y: bool, z: str] <: [y: bool!, z: obj, x: int | float];`);
				assert.ok(!SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, Int16],
					[0x101n, SolidBoolean],
					[0x102n, SolidString],
				])).isSubtypeOf(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, SolidBoolean.union(SolidNull)],
					[0x101n, SolidObject],
					[0x102n, Int16.union(Float64)],
				]))), `[x: int, y: bool, z: str] !<: [x: bool!, y: obj, z: int | float];`);
			});
			it('returns false if assigned is smaller than assignee.', () => {
				assert.ok(!SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, Int16],
					[0x101n, SolidBoolean],
				])).isSubtypeOf(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x101n, SolidBoolean.union(SolidNull)],
					[0x102n, SolidObject],
					[0x100n, Int16.union(Float64)],
				]))), `[x: int, y: bool] !<: [y: bool!, z: obj, x: int | float];`);
			});
			it('skips rest if assigned is larger than assignee.', () => {
				assert.ok(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, Int16],
					[0x101n, SolidBoolean],
					[0x102n, SolidString],
				])).isSubtypeOf(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x101n, SolidBoolean.union(SolidNull)],
					[0x100n, Int16.union(Float64)],
				]))), `[x: int, y: bool, z: str] <: [y: bool!, x: int | float];`);
			});
			it('returns false if assignee contains keys that assigned does not.', () => {
				assert.ok(!SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x100n, Int16],
					[0x101n, SolidBoolean],
					[0x102n, SolidString],
				])).isSubtypeOf(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
					[0x101n, SolidBoolean.union(SolidNull)],
					[0x102n, SolidObject],
					[0x103n, Int16.union(Float64)],
				]))), `[x: int, y: bool, z: str] !<: [y: bool!, z: obj, w: int | float]`);
			});
			Dev.supports('optionalEntries') && it('optional entries are not assignable to required entries.', () => {
				assert.ok(new SolidTypeRecord(new Map<bigint, TypeEntry>([
					[0x100n, {type: SolidString,  optional: false}],
					[0x101n, {type: Int16,        optional: true}],
					[0x102n, {type: SolidBoolean, optional: false}],
				])).isSubtypeOf(new SolidTypeRecord(new Map<bigint, TypeEntry>([
					[0x100n, {type: SolidString,  optional: true}],
					[0x101n, {type: Int16,        optional: true}],
					[0x102n, {type: SolidBoolean, optional: false}],
				]))), `[a: str, b?: int, c: bool] <: [a?: str, b?: int, c: bool]`);
				assert.ok(!new SolidTypeRecord(new Map<bigint, TypeEntry>([
					[0x100n, {type: SolidString,  optional: false}],
					[0x101n, {type: Int16,        optional: true}],
					[0x102n, {type: SolidBoolean, optional: false}],
				])).isSubtypeOf(new SolidTypeRecord(new Map<bigint, TypeEntry>([
					[0x100n, {type: SolidString,  optional: true}],
					[0x101n, {type: Int16,        optional: false}],
					[0x102n, {type: SolidBoolean, optional: false}],
				]))), `[a: str, b?: int, c: bool] !<: [a?: str, b: int, c: bool]`);
			});
		});

		Dev.supports('literalCollection') && describe('SolidTypeMapping', () => {
			it('is a subtype but not a supertype of `SolidObject`.', () => {
				assert.ok(new SolidTypeMapping(Int16, SolidBoolean).isSubtypeOf(SolidObject), `Mapping.<int, bool> <: obj`);
				assert.ok(!SolidObject.isSubtypeOf(new SolidTypeMapping(Int16, SolidBoolean)), `obj !<: Mapping.<int, bool>`);
			});
			it('Covariance: `A <: C && B <: D --> Mapping.<A, B> <: Mapping.<C, D>`.', () => {
				assert.ok(new SolidTypeMapping(Int16, SolidBoolean).isSubtypeOf(
					new SolidTypeMapping(Int16.union(Float64), SolidBoolean.union(SolidNull))
				), `Mapping.<int, bool> <: Mapping.<int | float, bool | null>`);
				assert.ok(!new SolidTypeMapping(Int16, SolidBoolean).isSubtypeOf(
					new SolidTypeMapping(SolidBoolean.union(SolidNull), SolidObject)
				), `Mapping.<int, bool> !<: Mapping.<bool | null, obj>`);
			});
		});

		describe('SolidTypeInterface', () => {
			it('returns `true` if the subtype contains at least the properties of the supertype.', () => {
				assert.ok(!t0.isSubtypeOf(t1))
				assert.ok(!t1.isSubtypeOf(t0))
				assert.ok(new SolidTypeInterface(new Map<string, SolidType>([
					['foo', SolidString],
					['bar', SolidNull],
					['diz', SolidBoolean],
					['qux', SolidNumber],
				])).isSubtypeOf(t0))
			})
		})
	})


	describe('SolidTypeIntersection', () => {
		Dev.supports('literalCollection') && describe('#combineTuplesOrRecords', () => {
			context('with tuple operands.', () => {
				it('takes the union of indices of constituent types.', () => {
					assert.ok(SolidTypeTuple.fromTypes([
						SolidObject,
						SolidNull,
						SolidBoolean,
					]).intersectWithTuple(SolidTypeTuple.fromTypes([
						SolidObject,
						Int16,
					])).equals(SolidTypeTuple.fromTypes([
						SolidObject,
						SolidNull.intersect(Int16),
						SolidBoolean,
					])), `
						[obj, null, bool] & [obj, int]
						==
						[obj, null & int, bool]
					`);
				});
				Dev.supports('optionalEntries') && it('takes the conjunction of optionality.', () => {
					assert.ok(new SolidTypeTuple([
						{type: SolidObject,  optional: false},
						{type: SolidNull,    optional: true},
						{type: SolidBoolean, optional: true},
					]).intersectWithTuple(new SolidTypeTuple([
						{type: SolidObject, optional: false},
						{type: Int16,       optional: false},
						{type: Float64,     optional: true},
					])).equals(new SolidTypeTuple([
						{type: SolidObject,                     optional: false},
						{type: SolidNull.intersect(Int16),      optional: false},
						{type: SolidBoolean.intersect(Float64), optional: true},
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
						[foo, SolidObject],
						[bar, SolidNull],
						[qux, SolidBoolean],
					])).intersectWithRecord(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
						[foo, SolidObject],
						[diz, Int16],
						[qux, SolidString],
					]))).equals(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
						[foo, SolidObject],
						[bar, SolidNull],
						[qux, SolidBoolean.intersect(SolidString)],
						[diz, Int16],
					]))), `
						[foo: obj, bar: null, qux: bool] & [foo: obj, diz: int, qux: str]
						==
						[foo: obj, bar: null, qux: bool & str, diz: int]
					`);
				})
				Dev.supports('optionalEntries') && it('takes the conjunction of optionality.', () => {
					const [foo, bar, qux, diz] = [0x100n, 0x101n, 0x102n, 0x103n];
					assert.ok(new SolidTypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: SolidObject,  optional: false}],
						[bar, {type: SolidNull,    optional: true}],
						[qux, {type: SolidBoolean, optional: true}],
					])).intersectWithRecord(new SolidTypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: SolidObject, optional: false}],
						[diz, {type: Int16,       optional: true}],
						[qux, {type: SolidString, optional: false}],
					]))).equals(new SolidTypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: SolidObject,                         optional: false}],
						[bar, {type: SolidNull,                           optional: true}],
						[qux, {type: SolidBoolean.intersect(SolidString), optional: false}],
						[diz, {type: Int16,                               optional: true}],
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
		Dev.supports('literalCollection') && describe('#combineTuplesOrRecords', () => {
			context('with tuple operands.', () => {
				it('takes the intersection of indices of constituent types.', () => {
					assert.ok(SolidTypeTuple.fromTypes([
						SolidObject,
						SolidNull,
						SolidBoolean,
					]).unionWithTuple(SolidTypeTuple.fromTypes([
						SolidObject,
						Int16,
					])).equals(SolidTypeTuple.fromTypes([
						SolidObject,
						SolidNull.union(Int16),
					])), `
						[obj, null, bool] | [obj, int]
						==
						[obj, null | int]
					`);
				});
				Dev.supports('optionalEntries') && it('takes the disjunction of optionality.', () => {
					assert.ok(new SolidTypeTuple([
						{type: SolidObject,  optional: false},
						{type: SolidNull,    optional: true},
						{type: SolidBoolean, optional: true},
					]).unionWithTuple(new SolidTypeTuple([
						{type: SolidObject, optional: false},
						{type: Int16,       optional: false},
						{type: Float64,     optional: true},
					])).equals(new SolidTypeTuple([
						{type: SolidObject,                 optional: false},
						{type: SolidNull.union(Int16),      optional: true},
						{type: SolidBoolean.union(Float64), optional: true},
					])), `
						[obj, ?: null, ?: bool] | [obj, int, ?: float]
						==
						[obj, ?: null | int, ?: bool | float]
					`);
				});
				it('some value assignable to combo type might not be assignable to union.', () => {
					const left: SolidTypeTuple = SolidTypeTuple.fromTypes([
						SolidBoolean,
						Int16,
					]);
					const right: SolidTypeTuple = SolidTypeTuple.fromTypes([
						Int16,
						SolidBoolean,
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
						[foo, SolidObject],
						[bar, SolidNull],
						[qux, SolidBoolean],
					])).unionWithRecord(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
						[foo, SolidObject],
						[diz, Int16],
						[qux, SolidString],
					]))).equals(SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
						[foo, SolidObject],
						[qux, SolidBoolean.union(SolidString)],
					]))), `
						[foo: obj, bar: null, qux: bool] | [foo: obj, diz: int, qux: str]
						==
						[foo: obj, qux: bool | str]
					`);
				});
				Dev.supports('optionalEntries') && it('takes the disjunction of optionality.', () => {
					const [foo, bar, qux, diz] = [0x100n, 0x101n, 0x102n, 0x103n];
					assert.ok(new SolidTypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: SolidObject,  optional: false}],
						[bar, {type: SolidNull,    optional: true}],
						[qux, {type: SolidBoolean, optional: true}],
					])).unionWithRecord(new SolidTypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: SolidObject, optional: false}],
						[diz, {type: Int16,       optional: true}],
						[qux, {type: SolidString, optional: false}],
					]))).equals(new SolidTypeRecord(new Map<bigint, TypeEntry>([
						[foo, {type: SolidObject,                     optional: false}],
						[qux, {type: SolidBoolean.union(SolidString), optional: true}],
					]))), `
						[foo: obj, bar?: null, qux?: bool] | [foo: obj, diz?: int, qux: str]
						==
						[foo: obj, qux?: bool | str]
					`);
				});
				it('some value assignable to combo type might not be assignable to union.', () => {
					const left: SolidTypeRecord = SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
						[0x100n, SolidBoolean],
						[0x101n, Int16],
						[0x102n, SolidString],
					]));
					const right: SolidTypeRecord = SolidTypeRecord.fromTypes(new Map<bigint, SolidType>([
						[0x103n, SolidString],
						[0x100n, Int16],
						[0x101n, SolidBoolean],
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
