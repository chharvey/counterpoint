import type binaryen from 'binaryen';
import {Object as CPObject} from './Object.js';



/**
 * Known subclasses:
 * - CollectionIndexed
 * - CollectionKeyed
 * - Set
 * - Map
 */
export abstract class Collection extends CPObject {
	public override build(mod: binaryen.Module): binaryen.ExpressionRef {
		mod;
		throw new Error('`Collection#build` not yet supported.');
	}
}
