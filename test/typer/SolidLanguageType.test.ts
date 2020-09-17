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
			assert.deepStrictEqual(t0.intersect(t1).properties, new Map<string, SolidLanguageType>([
				['foo', SolidObject],
				['bar', SolidNull],
				['qux', SolidNumber],
				['diz', SolidBoolean.intersect(SolidString)],
			]))
		})
		it('4  | `T & unknown == T`', () => {
			builtin_types.forEach((t) => {
				assert.deepStrictEqual(t.intersect(SolidObject).properties, t.properties, `${ t }`)
			})
		})
		it('7 | `A & B == B & A`', () => {
			predicate2(builtin_types, (a, b) => {
				assert.deepStrictEqual(a.intersect(b).properties, b.intersect(a).properties, `${ a }, ${ b }`)
			})
		})
		it('9 | `(A & B) & C == A & (B & C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.deepStrictEqual(a.intersect(b).intersect(c).properties, a.intersect(b.intersect(c)).properties, `${ a }, ${ b }, ${ c }`)
			})
		})
		it('11 | `A & (B | C) == (A & B) | (A & C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.deepStrictEqual(a.intersect(b.union(c)).properties, a.intersect(b).union(a.intersect(c)).properties, `${ a }, ${ b }, ${ c }`)
			})
		})
	})


	describe('#union', () => {
		it('takes the intersection of properties of constituent types.', () => {
			assert.deepStrictEqual(t0.union(t1).properties, new Map<string, SolidLanguageType>([
				['foo', SolidObject],
				['diz', SolidBoolean.union(SolidString)],
			]))
		})
		it('6  | `T | unknown == unknown`', () => {
			builtin_types.forEach((t) => {
				assert.deepStrictEqual(t.union(SolidObject).properties, SolidObject.properties, `${ t }`)
			})
		})
		it('8 | `A | B == B | A`', () => {
			predicate2(builtin_types, (a, b) => {
				assert.deepStrictEqual(a.union(b).properties, b.union(a).properties, `${ a }, ${ b }`)
			})
		})
		it('10 | `(A | B) | C == A | (B | C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.deepStrictEqual(a.union(b).union(c).properties, a.union(b.union(c)).properties, `${ a }, ${ b }, ${ c }`)
			})
		})
		it('12 | `A | (B & C) == (A | B) & (A | C)`', () => {
			predicate3(builtin_types, (a, b, c) => {
				assert.deepStrictEqual(a.union(b.intersect(c)).properties, a.union(b).intersect(a.union(c)).properties, `${ a }, ${ b }, ${ c }`)
			})
		})
	})
})
