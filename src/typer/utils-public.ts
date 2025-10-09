import type {TYPE} from './index.ts';



/**
 * Internal representation of an entry of a tuple or mapping type.
 */
export type EntryType = {
	/** The type value, a Counterpoint Language Type. */
	readonly type:     TYPE.Type,
	/** Is the entry optional on the collection? */
	readonly optional: boolean,
};
