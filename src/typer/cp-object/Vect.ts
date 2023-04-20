import * as xjs from 'extrajs';
import {strictEqual} from '../../lib/index.js';
import {TYPE} from '../index.js';
import {languageValuesIdentical} from '../utils-private.js';
import type {Object as CPObject} from './Object.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class Vect<T extends CPObject = CPObject> extends CollectionIndexed<T> {
	public override toString(): string {
		return `\\${ super.toString() }`;
	}

	@strictEqual
	public override identical(value: CPObject): boolean {
		return value instanceof Vect && this.isIdenticalTo(value as this, (this_, that_) => (
			xjs.Array.is<T>(this_.items, that_.items, languageValuesIdentical)
		));
	}

	/**
	 * @inheritdoc
	 * Returns a TypeVect whose entries are the types of this Vect’s items.
	 */
	public override toType(): TYPE.TypeVect {
		return TYPE.TypeVect.fromTypes(this.items.map((it) => it.toType()));
	}
}
