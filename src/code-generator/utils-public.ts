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

	/** $List.$count */
	LIST_COUNT:    0,
	/** $List.$internal */
	LIST_INTERNAL: 1,

	/** $Dict.$count */
	DICT_COUNT:    0,
	/** $Dict.$internal */
	DICT_INTERNAL: 1,
} as const;
