import * as assert from 'assert'

import SolidLanguageType from '../../src/vm/SolidLanguageType.class'
import SolidObject  from '../../src/vm/SolidObject.class'
import SolidNull    from '../../src/vm/SolidNull.class'
import SolidBoolean from '../../src/vm/SolidBoolean.class'
import SolidNumber  from '../../src/vm/SolidNumber.class'
import SolidString  from '../../src/vm/SolidString.class'



describe('SolidLanguageType', () => {
	describe('#properties', () => {
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
		context('SolidTypeIntersection', () => {
			it('takes the union of properties of constituent types.', () => {
				assert.deepStrictEqual(t0.intersect(t1).properties, new Map<string, SolidLanguageType>([
					['foo', SolidObject],
					['bar', SolidNull],
					['qux', SolidNumber],
					['diz', SolidBoolean.intersect(SolidString)],
				]))
			})
		})
		context('SolidTypeUnion', () => {
			it('takes the intersection of properties of constituent types.', () => {
				assert.deepStrictEqual(t0.union(t1).properties, new Map<string, SolidLanguageType>([
					['foo', SolidObject],
					['diz', SolidBoolean.union(SolidString)],
				]))
			})
		})
	})
})
