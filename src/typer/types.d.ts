/**
 * Internal representation of an entry of a tuple or mapping type.
 * @property type     - the type value, a Solid Language Type
 * @property optional - is the entry optional on the collection?
 */
export type TypeEntry = {
	type:     SolidType,
	optional: boolean,
};
