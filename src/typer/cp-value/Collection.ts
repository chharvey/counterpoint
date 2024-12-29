import type binaryen from 'binaryen';
import type {Builder} from '../../index.js';
import {Value} from './Value.js';



/**
 * Known subclasses:
 * - CollectionIndexed
 * - CollectionKeyed
 * - ValueSet
 * - ValueMap
 */
export abstract class Collection extends Value {
	public override build(_: Builder): binaryen.ExpressionRef {
		throw new Error('`Collection#build` not yet supported.');
	}
}
