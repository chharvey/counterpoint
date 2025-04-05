import type binaryen from 'binaryen';
import {Value} from './Value.ts';



/**
 * Known subclasses:
 * - CollectionIndexed
 * - CollectionKeyed
 * - ValueSet
 * - ValueMap
 */
export abstract class Collection extends Value {
	/**
	 * Return the number of items/properties/elements/cases in this collection.
	 */
	public abstract get count(): bigint;

	public override build(mod: binaryen.Module): binaryen.ExpressionRef {
		mod;
		throw new Error('`Collection#build` not yet supported.');
	}
}
