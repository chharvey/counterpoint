;; Returns whether a Property is a “tombstone”, that is, whether it represents a deletion in a Dict.
;;
;; Property tombstones are used when deleting Dict entries so as not to break linear probing chains.
;; They may be returned when looking up a key for which an entry has since been deleted.
;; Application code should treat tombstones as non-entries —
;; they should be treated the same as null when getting, and should be replaced when setting.
;;
;; A Property tombstone is implemented as a Property with a key of `\xff`.
;; This will not conflict with real Properties, whose keys are all at least `\x100`
;; per the Counterpoint spec (see **TokenWorth** algorithm).
;;
;; Property tombstones contribute to the load factor of a Dict:
;; they are counted when determining when a Dict’s array should be grown or shrunk.
;; When growing/shrinking an array, tombstones are not copied over to the new array.
(func $Property.is-tombstone (param $prop (ref null $Property)) (result i32)
	(if (result i32) (ref.is_null (local.get $prop))
		(then (i32.const 0))
		(else (i64.lt_u (struct.get $Property $key (local.get $prop)) (i64.const 0x100)))
	)
)



;; Returns whether a Case is a “tombstone”, that is, whether it represents a deletion in a Map.
;;
;; Case tombstones are used when deleting Map entries so as not to break linear probing chains.
;; They may be returned when looking up an antecedent for which an entry has since been deleted.
;; Application code should treat tombstones as non-entries —
;; they should be treated the same as null when getting, and should be replaced when setting.
;;
;; A Case tombstone is implemented as a pair of Values both with a tag of `0`.
;; This will not conflict with real Cases, pairs of Values whose tags are `1` or `2`.
;; (A case containing one Value with a tag of `1` or `2` and one with a tag of `0` is not a valid Case.)
;;
;; Case tombstones contribute to the load factor of a Map:
;; they are counted when determining when a Map’s array should be grown or shrunk.
;; When growing/shrinking an array, tombstones are not copied over to the new array.
(func $Case.is-tombstone (param $case (ref null $Case)) (result i32)
	(if (result i32) (ref.is_null (local.get $case))
		(then (i32.const 0))
		(else (i32.and
			(i32.eqz (struct.get $Value $tag (struct.get $Case $ant (local.get $case))))
			(i32.eqz (struct.get $Value $tag (struct.get $Case $con (local.get $case))))
		))
	)
)



;; Create and return a new Property tombstone.
(func $Property.new-tombstone (result (ref $Property))
	(struct.new $Property
		(i64.const 0xff)
		(struct.new_default $Value)
	)
)



;; Create and return a new Case tombstone.
(func $Case.new-tombstone (result (ref $Case))
	(struct.new $Case
		(struct.new_default $Value)
		(struct.new_default $Value)
	)
)
