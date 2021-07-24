import * as assert from 'assert'
import {Dev} from '../../src/core/index.js';
import {
	SolidType,
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
					[new SolidTuple(),                                             new SolidTypeTuple()],
					[new SolidTuple([new Int16(42n)]),                             new SolidTypeTuple([Int16])],
					[new SolidTuple([new Float64(4.2), new SolidString('hello')]), new SolidTypeTuple([Float64, SolidString])],
				]).forEach((tupletype, value) => {
					assert.ok(new SolidTypeConstant(value).isSubtypeOf(SolidTuple), `let x: Tuple = ${ value };`);
					assert.ok(new SolidTypeConstant(value).isSubtypeOf(tupletype),  `let x: ${ tupletype } = ${ value };`);
				});
			});
			it('constant record types should be subtype of a record type instance.', () => {
				new Map<SolidObject, SolidTypeRecord>([
					[new SolidRecord(new Map<bigint, SolidObject>([[0x100n, new Int16(42n)]])),                                       new SolidTypeRecord(new Map<bigint, SolidType>([[0x100n, Int16]]))],
					[new SolidRecord(new Map<bigint, SolidObject>([[0x100n, new Float64(4.2)], [0x101n, new SolidString('hello')]])), new SolidTypeRecord(new Map<bigint, SolidType>([[0x100n, Float64], [0x101n, SolidString]]))],
					[new SolidRecord(new Map<bigint, SolidObject>([[0x100n, new SolidString('hello')], [0x101n, new Float64(4.2)]])), new SolidTypeRecord(new Map<bigint, SolidType>([[0x100n, SolidString], [0x101n, Float64]]))],
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
				assert.ok(new SolidTypeTuple([
					Int16,
					SolidBoolean,
					SolidString,
				]).isSubtypeOf(SolidObject), `[int, bool, str] <: obj;`);
				assert.ok(!SolidObject.isSubtypeOf(new SolidTypeTuple([
					Int16,
					SolidBoolean,
					SolidString,
				])), `obj !<: [int, bool, str]`);
			});
			it('matches per index.', () => {
				assert.ok(new SolidTypeTuple([
					Int16,
					SolidBoolean,
					SolidString,
				]).isSubtypeOf(new SolidTypeTuple([
					Int16.union(Float64),
					SolidBoolean.union(SolidNull),
					SolidObject,
				])), `[int, bool, str] <: [int | float, bool!, obj];`);
				assert.ok(!new SolidTypeTuple([
					Int16,
					SolidBoolean,
					SolidString,
				]).isSubtypeOf(new SolidTypeTuple([
					SolidBoolean.union(SolidNull),
					SolidObject,
					Int16.union(Float64),
				])), `[int, bool, str] !<: [bool!, obj, int | float];`);
			});
			it('returns false if assigned is smaller than assignee.', () => {
				assert.ok(!new SolidTypeTuple([
					Int16,
					SolidBoolean,
				]).isSubtypeOf(new SolidTypeTuple([
					Int16.union(Float64),
					SolidBoolean.union(SolidNull),
					SolidObject,
				])), `[int, bool] !<: [int | float, bool!, obj];`);
			});
			it('skips rest if assigned is larger than assignee.', () => {
				assert.ok(new SolidTypeTuple([
					Int16,
					SolidBoolean,
					SolidString,
				]).isSubtypeOf(new SolidTypeTuple([
					Int16.union(Float64),
					SolidBoolean.union(SolidNull),
				])), `[int, bool, str] <: [int | float, bool!];`);
			});
		});

		Dev.supports('literalCollection') && describe('SolidTypeRecord', () => {
			it('is a subtype but not a supertype of `SolidObject`.', () => {
				assert.ok(new SolidTypeRecord(new Map<bigint, SolidType>([
					[0x100n, Int16],
					[0x101n, SolidBoolean],
					[0x102n, SolidString],
				])).isSubtypeOf(SolidObject), `[x: int, y: bool, z: str] <: obj;`);
				assert.ok(!SolidObject.isSubtypeOf(new SolidTypeRecord(new Map<bigint, SolidType>([
					[0x100n, Int16],
					[0x101n, SolidBoolean],
					[0x102n, SolidString],
				]))), `obj !<: [x: int, y: bool, z: str]`);
			});
			it('matches per key.', () => {
				assert.ok(new SolidTypeRecord(new Map<bigint, SolidType>([
					[0x100n, Int16],
					[0x101n, SolidBoolean],
					[0x102n, SolidString],
				])).isSubtypeOf(new SolidTypeRecord(new Map<bigint, SolidType>([
					[0x101n, SolidBoolean.union(SolidNull)],
					[0x102n, SolidObject],
					[0x100n, Int16.union(Float64)],
				]))), `[x: int, y: bool, z: str] <: [y: bool!, z: obj, x: int | float];`);
				assert.ok(!new SolidTypeRecord(new Map<bigint, SolidType>([
					[0x100n, Int16],
					[0x101n, SolidBoolean],
					[0x102n, SolidString],
				])).isSubtypeOf(new SolidTypeRecord(new Map<bigint, SolidType>([
					[0x100n, SolidBoolean.union(SolidNull)],
					[0x101n, SolidObject],
					[0x102n, Int16.union(Float64)],
				]))), `[x: int, y: bool, z: str] !<: [x: bool!, y: obj, z: int | float];`);
			});
			it('returns false if assigned is smaller than assignee.', () => {
				assert.ok(!new SolidTypeRecord(new Map<bigint, SolidType>([
					[0x100n, Int16],
					[0x101n, SolidBoolean],
				])).isSubtypeOf(new SolidTypeRecord(new Map<bigint, SolidType>([
					[0x101n, SolidBoolean.union(SolidNull)],
					[0x102n, SolidObject],
					[0x100n, Int16.union(Float64)],
				]))), `[x: int, y: bool] !<: [y: bool!, z: obj, x: int | float];`);
			});
			it('skips rest if assigned is larger than assignee.', () => {
				assert.ok(new SolidTypeRecord(new Map<bigint, SolidType>([
					[0x100n, Int16],
					[0x101n, SolidBoolean],
					[0x102n, SolidString],
				])).isSubtypeOf(new SolidTypeRecord(new Map<bigint, SolidType>([
					[0x101n, SolidBoolean.union(SolidNull)],
					[0x100n, Int16.union(Float64)],
				]))), `[x: int, y: bool, z: str] <: [y: bool!, x: int | float];`);
			});
			it('returns false if assignee contains keys that assigned does not.', () => {
				assert.ok(!new SolidTypeRecord(new Map<bigint, SolidType>([
					[0x100n, Int16],
					[0x101n, SolidBoolean],
					[0x102n, SolidString],
				])).isSubtypeOf(new SolidTypeRecord(new Map<bigint, SolidType>([
					[0x101n, SolidBoolean.union(SolidNull)],
					[0x102n, SolidObject],
					[0x103n, Int16.union(Float64)],
				]))), `[x: int, y: bool, z: str] !<: [y: bool!, z: obj, w: int | float]`);
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
			it('takes the union of indices of constituent tuple types.', () => {
				assert.ok(new SolidTypeTuple([
					SolidObject,
					SolidNull,
					SolidBoolean,
				]).intersectWithTuple(new SolidTypeTuple([
					SolidObject,
					Int16,
				])).equals(new SolidTypeTuple([
					SolidObject,
					SolidNull.intersect(Int16),
					SolidBoolean,
				])), `
					[obj, null, bool] & [obj, int]
					==
					[obj, null & int, bool]
				`);
			});
			it('takes the union of properties of constituent record types.', () => {
				const [foo, bar, qux, diz] = [0x100n, 0x101n, 0x102n, 0x103n];
				assert.ok(new SolidTypeRecord(new Map<bigint, SolidType>([
					[foo, SolidObject],
					[bar, SolidNull],
					[qux, SolidBoolean],
				])).intersectWithRecord(new SolidTypeRecord(new Map<bigint, SolidType>([
					[foo, SolidObject],
					[diz, Int16],
					[qux, SolidString],
				]))).equals(new SolidTypeRecord(new Map<bigint, SolidType>([
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
		});
	});


	describe('SolidTypeUnion', () => {
		Dev.supports('literalCollection') && describe('#combineTuplesOrRecords', () => {
			it('takes the intersection of indices of constituent tuple types.', () => {
				assert.ok(new SolidTypeTuple([
					SolidObject,
					SolidNull,
					SolidBoolean,
				]).unionWithTuple(new SolidTypeTuple([
					SolidObject,
					Int16,
				])).equals(new SolidTypeTuple([
					SolidObject,
					SolidNull.union(Int16),
				])), `
					[obj, null, bool] | [obj, int]
					==
					[obj, null | int]
				`);
			});
			it('takes the intersection of properties of constituent record types.', () => {
				const [foo, bar, qux, diz] = [0x100n, 0x101n, 0x102n, 0x103n];
				assert.ok(new SolidTypeRecord(new Map<bigint, SolidType>([
					[foo, SolidObject],
					[bar, SolidNull],
					[qux, SolidBoolean],
				])).unionWithRecord(new SolidTypeRecord(new Map<bigint, SolidType>([
					[foo, SolidObject],
					[diz, Int16],
					[qux, SolidString],
				]))).equals(new SolidTypeRecord(new Map<bigint, SolidType>([
					[foo, SolidObject],
					[qux, SolidBoolean.union(SolidString)],
				]))), `
					[foo: obj, bar: null, qux: bool] | [foo: obj, diz: int, qux: str]
					==
					[foo: obj, qux: bool | str]
				`);
			})
			it('some value assignable to combo tuple type might not be assignable to union.', () => {
				const v: SolidTuple<SolidBoolean> = new SolidTuple<SolidBoolean>([SolidBoolean.TRUE, SolidBoolean.TRUE]);
				assert.ok(new SolidTypeTuple([SolidBoolean.union(Int16), Int16.union(SolidBoolean)]).includes(v), `
					let x: [bool | int, int | bool] = [true, true]; % ok
				`);
				assert.ok(!new SolidTypeTuple([
					SolidBoolean,
					Int16,
				]).union(new SolidTypeTuple([
					Int16,
					SolidBoolean,
				])).includes(v), `
					let x: [bool, int] | [int, bool] = [true, true]; %> TypeError
				`);
			});
			it('some value assignable to combo record type might not be assignable to union.', () => {
				const v: SolidRecord<SolidBoolean> = new SolidRecord<SolidBoolean>(new Map<bigint, SolidBoolean>([
					[0x100n, SolidBoolean.TRUE],
					[0x101n, SolidBoolean.TRUE],
				]));
				assert.ok(new SolidTypeRecord(new Map<bigint, SolidType>([
					[0x100n, SolidBoolean.union(Int16)],
					[0x101n, Int16.union(SolidBoolean)],
				])).includes(v), `
					let x: [a: bool | int, b: int | bool] = [a= true, b= true]; % ok
				`);
				assert.ok(!new SolidTypeRecord(new Map<bigint, SolidType>([
					[0x100n, SolidBoolean],
					[0x101n, Int16],
					[0x102n, SolidString],
				])).union(new SolidTypeRecord(new Map<bigint, SolidType>([
					[0x103n, SolidString],
					[0x100n, Int16],
					[0x101n, SolidBoolean],
				]))).includes(v), `
					let x: [a: bool, b: int, c: str] | [d: str, a: int, b: bool] = [a= true, b= true]; %> TypeError
				`);
			});
		});
	});
})
