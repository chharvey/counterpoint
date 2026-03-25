/** Struct field constant indices. */
export const STRUCT_FIELD = {
	/** $Value.$tag */
	VALUE_TAG:       0,
	/** $Value.$primitive */
	VALUE_PRIMITIVE: 1,
	/** $Value.$composite */
	VALUE_COMPOSITE: 2,

	/** $Property.$key */
	PROPERTY_KEY:   0,
	/** $Property.$value */
	PROPERTY_VALUE: 1,

	/** $List.$size */
	LIST_SIZE:     0,
	/** $List.$internal */
	LIST_INTERNAL: 1,

	/** $Dict.$size */
	DICT_SIZE:     0,
	/** $Dict.$internal */
	DICT_INTERNAL: 1,
} as const;
