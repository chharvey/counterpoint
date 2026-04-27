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
	(if (result i32)
		(ref.is_null (local.get $case))
		(then (i32.const 0))
		(else (i32.and
			(i32.eqz (struct.get $Value $tag (struct.get $Case $ant (local.get $case))))
			(i32.eqz (struct.get $Value $tag (struct.get $Case $con (local.get $case))))
		))
	)
)



;; Create and return a new Case tombstone.
(func $Case.new-tombstone (result (ref $Case))
	(struct.new $Case
		(struct.new_default $Value)
		(struct.new_default $Value)
	)
)
