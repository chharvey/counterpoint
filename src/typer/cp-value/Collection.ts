import type binaryen from 'binaryen';
import type {Builder} from '../../index.js';
import {Value} from './Value.js';



/**
 * Known subclasses:
 * - CollectionIndexed
 * - CollectionKeyed
 * - Set
 * - Map
 */
export abstract class Collection extends Value {
	public override build(_: Builder): binaryen.ExpressionRef {
		throw new Error('`Collection#build` not yet supported.');
	}
}
