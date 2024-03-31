import type {TYPE} from './index.js';



/**
 * Internal representation of an entry of a tuple or mapping type.
 * @property type     - the type value, a Counterpoint Language Type
 * @property optional - is the entry optional on the collection?
 */
export type TypeEntry = {
	readonly type:     TYPE.Type,
	readonly optional: boolean,
};



/**
 * Returns whether a Type object implements the Combinable interface.
 * @param type the object to test
 * @return Does the object implement {@link TYPE.Combinable}?
 */
export function isCombinable(t: TYPE.Type): t is TYPE.Combinable {
	return (
		   'combineTuplesOrRecords' in t
		&& typeof t.combineTuplesOrRecords === 'function'
		&& t.combineTuplesOrRecords.length === 0
	);
}
