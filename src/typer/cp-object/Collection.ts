import type binaryen from 'binaryen';
import type {Builder} from '../../index.js';
import {Object as CPObject} from './Object.js';



/**
 * Known subclasses:
 * - CollectionIndexed
 * - CollectionKeyed
 * - Set
 * - Map
 */
export abstract class Collection extends CPObject {
	public override build(_: Builder): binaryen.ExpressionRef {
		throw new Error('`Collection#build` not yet supported.');
	}
}
