import type binaryen from 'binaryen';
import {Value} from './Value.js';



/**
 * Known subclasses:
 * - CollectionIndexed
 * - CollectionKeyed
 * - ValueSet
 * - ValueMap
 */
export abstract class Collection extends Value {
	public override build(mod: binaryen.Module): binaryen.ExpressionRef {
		mod;
		throw new Error('`Collection#build` not yet supported.');
	}
}
