/** Struct field constant indices. */
export const STRUCT_FIELD = {
	/** $Value.$tag */
	VALUE_TAG:       0,
	/** $Value.$primitive */
	VALUE_PRIMITIVE: 1,
	/** $Value.$composite */
	VALUE_COMPOSITE: 2,

	/** $Property.$key */
	PROPERTY_KEY: 0,
	/** $Property.$val */
	PROPERTY_VAL: 1,

	/** $Case.$ant */
	CASE_ANT: 0,
	/** $Case.$con */
	CASE_CON: 1,

	/** $Object.$id */
	OBJECT_ID: 0,

	/** $List.$size */
	LIST_SIZE:     1,
	/** $List.$internal */
	LIST_INTERNAL: 2,

	/** $Dict.$size */
	DICT_SIZE:     1,
	/** $Dict.$internal */
	DICT_INTERNAL: 2,

	/** $Map.$size */
	MAP_SIZE:     1,
	/** $Map.$internal */
	MAP_INTERNAL: 2,
} as const;
