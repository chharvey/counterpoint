import * as assert from 'assert'

import {
	SolidLanguageType,
	SolidObject,
	SolidNull,
	SolidBoolean,
	SolidNumber,
	Int16,
	Float64,
	SolidString,
} from '../../src/validator/'



describe('SolidLanguageType', () => {
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
	const builtin_types: SolidLanguageType[] = [
		SolidObject,
		SolidNull,
		SolidBoolean,
		SolidNumber,
		Int16,
		Float64,
		SolidString,
		SolidLanguageType.NEVER,
	]
	const t0: SolidLanguageType = new SolidLanguageType(new Map<string, SolidLanguageType>([
		['foo', SolidObject],
		['bar', SolidNull],
		['diz', SolidBoolean],
	]))
	const t1: SolidLanguageType = new SolidLanguageType(new Map<string, SolidLanguageType>([
		['foo', SolidObject],
		['qux', SolidNumber],
		['diz', SolidString],
	]))


	describe('#intersect', () => {
		it('takes the union of properties of constituent types.', () => {
			assert.ok(t0.intersect(t1).equals(new SolidLanguageType(new Map<string, SolidLanguageType>([
				['foo', SolidObject],
				['bar', SolidNull],
				['qux', SolidNumber],
				['diz', SolidBoolean.intersect(SolidString)],
			]))))
		})
		it('3  | `T & never   == never`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.intersect(SolidLanguageType.NEVER).equals(SolidLanguageType.NEVER), `${ t }`)
			})
		})
		it('4  | `T & unknown == T`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.intersect(SolidObject).equals(t), `${ t }`)
			})
		})
		it('7 | `A & B == B & A`', () => {
			predicate2(builtin_types, (a, b) => {
				assert.ok(a.intersect(b).equals(b.intersect(a)), `${ a }, ${ b }`)
			})
		})
		it('9 | `(A & B) & C == A & (B & C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.intersect(b).intersect(c).equals(a.intersect(b.intersect(c))), `${ a }, ${ b }, ${ c }`)
			})
		})
		it('11 | `A & (B | C) == (A & B) | (A & C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.intersect(b.union(c)).equals(a.intersect(b).union(a.intersect(c))), `${ a }, ${ b }, ${ c }`)
			})
		})
	})


	describe('#union', () => {
		it('takes the intersection of properties of constituent types.', () => {
			assert.ok(t0.union(t1).equals(new SolidLanguageType(new Map<string, SolidLanguageType>([
				['foo', SolidObject],
				['diz', SolidBoolean.union(SolidString)],
			]))))
		})
		it('5  | `T | never   == T`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.union(SolidLanguageType.NEVER).equals(t), `${ t }`)
			})
		})
		it('6  | `T | unknown == unknown`', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.union(SolidObject).equals(SolidObject), `${ t }`)
			})
		})
		it('8 | `A | B == B | A`', () => {
			predicate2(builtin_types, (a, b) => {
				assert.ok(a.union(b).equals(b.union(a)), `${ a }, ${ b }`)
			})
		})
		it('10 | `(A | B) | C == A | (B | C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.union(b).union(c).equals(a.union(b.union(c))), `${ a }, ${ b }, ${ c }`)
			})
		})
		it('12 | `A | (B & C) == (A | B) & (A | C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.ok(a.union(b.intersect(c)).equals(a.union(b).intersect(a.union(c))), `${ a }, ${ b }, ${ c }`)
			})
		})
	})


	describe('#isSubtypeOf', () => {
		it('returns `true` if the subtype contains at least the properties of the supertype.', () => {
			assert.ok(!t0.isSubtypeOf(t1))
			assert.ok(!t1.isSubtypeOf(t0))
			assert.ok(new SolidLanguageType(new Map<string, SolidLanguageType>([
				['foo', SolidString],
				['bar', SolidNull],
				['diz', SolidBoolean],
				['qux', SolidNumber],
			])).isSubtypeOf(t0))
		})
		it('1. never <: T', () => {
			builtin_types.forEach((t) => {
				assert.ok(SolidLanguageType.NEVER.isSubtypeOf(t), `${ t }`)
			})
		})
		it('2. T <: Object', () => {
			builtin_types.forEach((t) => {
				assert.ok(t.isSubtypeOf(SolidObject), `${ t }`)
			})
		})
		it('13 | `A <: A`', () => {
			builtin_types.forEach((a) => {
				assert.ok(a.isSubtypeOf(a), `${ a }`)
			})
		})
		it('14 | `A <: B  &&  B <: A  -->  A == B`', () => {
			predicate2(builtin_types, (a, b) => {
				if (a.isSubtypeOf(b) && b.isSubtypeOf(a)) {
					assert.ok(a.equals(b), `${ a }, ${ b }`)
				}
			})
		})
		it('15 | `A <: B  &&  B <: C  -->  A <: C`', () => {
			predicate3(builtin_types, (a, b, c) => {
				if (a.isSubtypeOf(b) && b.isSubtypeOf(c)) {
					assert.ok(a.isSubtypeOf(c), `${ a }, ${ b }, ${ c }`)
				}
			})
		})
		it('16 | `A & B <: A  &&  A & B <: B`', () => {
			predicate2(builtin_types, (a, b) => {
				assert.ok(a.intersect(b).isSubtypeOf(a), `${ a }, ${ b }`)
				assert.ok(a.intersect(b).isSubtypeOf(b), `${ a }, ${ b }`)
			})
		})
		it('17 | `A <: A | B  &&  B <: A | B`', () => {
			predicate2(builtin_types, (a, b) => {
				assert.ok(a.isSubtypeOf(a.union(b)), `${ a }, ${ b }`)
				assert.ok(b.isSubtypeOf(a.union(b)), `${ a }, ${ b }`)
			})
		})
		it('18 | `A <: B  <->  A & B == A`', () => {
			predicate2(builtin_types, (a, b) => {
				if (a.isSubtypeOf(b)) {
					assert.ok(a.intersect(b).equals(a), `forward: ${ a }, ${ b }`)
				}
				if (a.intersect(b).equals(a)) {
					assert.ok(a.isSubtypeOf(b), `backward: ${ a }, ${ b }`)
				}
			})
		})
		it('19 | `A <: B  <->  A | B == B`', () => {
			predicate2(builtin_types, (a, b) => {
				if (a.isSubtypeOf(b)) {
					assert.ok(a.union(b).equals(b), `forward: ${ a }, ${ b }`)
				}
				if (a.union(b).equals(b)) {
					assert.ok(a.isSubtypeOf(b), `backward: ${ a }, ${ b }`)
				}
			})
		})
		it('20 | `A <: C  &&  A <: D  <->  A <: C & D`', () => {
			predicate3(builtin_types, (a, c, d) => {
				if (a.isSubtypeOf(c) && a.isSubtypeOf(d)) {
					assert.ok(a.isSubtypeOf(c.intersect(d)), `forward: ${ a }, ${ c }, ${ d }`)
				}
				if (a.isSubtypeOf(c.intersect(d))) {
					assert.ok(a.isSubtypeOf(c) && a.isSubtypeOf(d), `backward: ${ a }, ${ c }, ${ d }`)
				}
			})
		})
		it('21 | `A <: C  ||  A <: D  -->  A <: C | D`', () => {
			predicate3(builtin_types, (a, c, d) => {
				if (a.isSubtypeOf(c) || a.isSubtypeOf(d)) {
					assert.ok(a.isSubtypeOf(c.union(d)), `${ a }, ${ c }, ${ d }`)
				}
			})
		})
		it('22 | `A <: C  &&  B <: C  <->  A | B <: C`', () => {
			predicate3(builtin_types, (a, b, c) => {
				if (a.isSubtypeOf(c) && b.isSubtypeOf(c)) {
					assert.ok(a.union(b).isSubtypeOf(c), `forward: ${ a }, ${ b }, ${ c }`)
				}
				if (a.union(b).isSubtypeOf(c)) {
					assert.ok(a.isSubtypeOf(c) && b.isSubtypeOf(c), `backward: ${ a }, ${ b }, ${ c }`)
				}
			})
		})
		it('23 | `A <: C  ||  B <: C  -->  A & B <: C`', () => {
			predicate3(builtin_types, (a, b, c) => {
				if (a.isSubtypeOf(c) || b.isSubtypeOf(c)) {
					assert.ok(a.intersect(b).isSubtypeOf(c), `${ a }, ${ b }, ${ c }`)
				}
			})
		})
	})
})
