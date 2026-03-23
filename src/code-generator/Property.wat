;; Returns whether a Property is a “tombstone”, that is, whether it represents a deltion in a Dict.
;;
;; Tombstones are used when deleting Dict entries so as not to break linear probing chains.
;; They may be returned when looking up a key for which a property has since been deleted.
;; Application code should treat tombstones as non-entries —
;; they should be treated the same as null when getting, and should be replaced when setting.
;;
;; A tombstone is implemented as a Property with a key of `\xff`.
;; This will not conflict with real Properties, whose keys are all at least `\x100`
;; per the Counterpoint spec (see **TokenWorth** algorithm).
;;
;; Tombstones contribute to the load factor of a Dict:
;; they are counted when determining when a Dict’s array should be grown or shrunk.
;; When growing/shrinking an array, tombstones are not copied over to the new array.
(func $Property.is-tombstone (param $prop (ref null $Property)) (result i32)
	(if (result i32) (ref.is_null (local.get $prop))
		(then (i32.const 0))
		(else (i64.lt_u (struct.get $Property $key (local.get $prop)) (i64.const 0x100)))
	)
)



;; Create and return a new tombstone property.
(func $Property.new-tombstone (result (ref $Property))
	(struct.new $Property
		(i64.const 0xff)
		(struct.new_default $Value)
	)
)
