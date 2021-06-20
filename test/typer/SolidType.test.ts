import * as assert from 'assert'

import {Dev} from '../../src/core/index.js';
import {
	SolidType,
	SolidTypeConstant,
	SolidTypeInterface,
	SolidTypeTuple,
	SolidTypeRecord,
	SolidObject,
	SolidNull,
	SolidBoolean,
	SolidNumber,
	Int16,
	Float64,
	SolidString,
} from '../../src/typer/index.js';



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
		SolidObject,
		SolidNull,
		SolidBoolean,
		Int16,
		Float64,
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
		describe('SolidInterfaceType', () => {
			it('takes the union of properties of constituent types.', () => {
				assert.ok(t0.intersect(t1).equals(new SolidTypeInterface(new Map<string, SolidType>([
					['foo', SolidObject],
					['bar', SolidNull],
					['qux', SolidNumber],
					['diz', SolidBoolean.intersect(SolidString)],
				]))))
			})
		})
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
		describe('SolidInterfaceType', () => {
			it('takes the intersection of properties of constituent types.', () => {
				assert.ok(t0.union(t1).equals(new SolidTypeInterface(new Map<string, SolidType>([
					['foo', SolidObject],
					['diz', SolidBoolean.union(SolidString)],
				]))))
			})
		})
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
				SolidNull,
				SolidBoolean,
				Int16,
				Float64,
				SolidString,
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
		})

		Dev.supports('literalCollection') && describe('SolidTypeTuple', () => {
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
})
