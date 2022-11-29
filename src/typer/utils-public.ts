import type {Type} from './cp-type/index.js';



/**
 * Internal representation of an entry of a tuple or mapping type.
 * @property type     - the type value, a Counterpoint Language Type
 * @property optional - is the entry optional on the collection?
 */
export type TypeEntry = {
	readonly type:     Type,
	readonly optional: boolean,
};
