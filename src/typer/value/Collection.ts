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
}
