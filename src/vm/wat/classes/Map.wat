;; Returns the number of “live” elements in the Map.
;; “Live” elements are non-null, non-tombstone cases.
(func $Map.count (param $map (ref $Map)) (result i32)
	;; the return value, the number of live elements.
	(local $count i32)
	;; the Map’s internal array.
	(local $internal (ref $MapInternal))
	;; index of iteration.
	(local $i i32)
	;; object of iteration.
	(local $case (ref null $Case))

	(local.set $count    (i32.const 0))
	(local.set $internal (struct.get $Map $internal (local.get $map)))

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $internal))))
			(local.set $case (array.get $MapInternal (local.get $internal) (local.get $i)))
			;; if the case is “live”, increment the count
			(if
				(i32.and
					(i32.eqz (ref.is_null (local.get $case)))
					(i32.eqz (call $Case.is-tombstone (local.get $case)))
				)
				(then (local.set $count (i32.add (local.get $count) (i32.const 1))))
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
	(local.get $count)
)



;; Find a Case in a Map with the given antecedent.
;; If a Case with the ant is found, returns the Case and its matching index.
;; Else, returns a null Case or tombstone with the index that the ant hashes to.
;;
;; Useful for get, set, and delete operations:
;; - when getting:
;; 	- if null or a “tombstone” is returned, no entry with the given ant exists in the Map
;; 	- if a non-null, “live” Case is returned, its consequent is what you want
;; - when setting:
;; 	- if null is returned, it means you’re adding a new case; you should put the new entry at the returned index and increment the Map’s size
;; 	- if a “tombstone” or a non-null, “live” Case is returned, you should replace it with the new entry, but *do not* increment the Map’s size
;; - when deleting:
;; 	- if null or a “tombstone” is returned, it means the ant wasn’t found and the Map was not mutated; *do not* change the Map’s size
;; 	- if a non-null, “live” Case is returned, it was deleted from the Map and replaced with a tombstone; *do not* change the Map’s size (as tombstones are still counted)
(func $Map.find (param $map (ref $Map)) (param $ant (ref $Value)) (result i32 (ref null $Case))
	;; the given Map’s internal array.
	(local $internal (ref $MapInternal))
	;; the length of the array. constant.
	(local $ARRLEN i32)
	;; index of the array to retrieve from. increments on each loop until an entry or null is found.
	(local $index i32)
	;; case at the specified index.
	(local $case (ref null $Case))
	;; the index and object of the first tombstone we’ve passed, if any.
	;; if the ant is not in the Map and `$tombcase` is set,
	;; return it and `$tombidx` instead of the current prop and index of iteration.
	;; this will tell callers of `$Map.set` that we’re reusing a tombstone, so incrementing `$size` should not be done.
	(local $tombidx  i32)
	(local $tombcase (ref null $Case))

	(local.set $internal (struct.get $Map $internal (local.get $map)))
	(local.set $ARRLEN   (array.len (local.get $internal)))
	(local.set $index    (call $util:mod (i32.wrap_i64 (call $Value.hash (local.get $ant))) (local.get $ARRLEN))) ;; will trap if ARRLEN == 0
	(local.set $tombidx  (i32.const -1))
	(local.set $tombcase (ref.null $Case))

	(loop $repeat
		(local.set $case (array.get $MapInternal (local.get $internal) (local.get $index)))
		;; if the current case is null, the key is definitely not in the Map.
		;; if we’ve passed a tombstone, return it and its index.
		;; otherwise, return the current null case and its index.
		(if
			(ref.is_null (local.get $case))
			(then (return (if (result i32 (ref null $Case))
				(ref.is_null (local.get $tombcase))
				(then (local.get $index)   (local.get $case))
				(else (local.get $tombidx) (local.get $tombcase))
			)))
		)
		;; if the antecedents match, we have our result.
		(if
			(call $Value.bool-to-i32 (call $op:id (struct.get $Case $ant (local.get $case)) (local.get $ant)))
			(then (return (local.get $index) (local.get $case)))
		)
		;; if the current case is a tombstone, store it, then continue the search.
		(if
			(call $Case.is-tombstone (local.get $case))
			(then
				(local.set $tombidx  (local.get $index))
				(local.set $tombcase (local.get $case))
			)
		)
		;; a load factor is enforced; this guarantees some empty slots, so the loop is guaranteed to terminate
		(local.set $index (call $util:mod (i32.add (local.get $index) (i32.const 1)) (local.get $ARRLEN)))
		(br $repeat)
	)
)



;; Reallocate a Map’s internal array as needed, adjusting for size.
;; Only the Map’s “live” (non-tombstone) cases are copied over to the new array,
;; according to the usual key hashing and linear probing technique, and its size and count are updated.
;; There is no guarantee the entries’ positioning and/or order will be preserved.
(func $Map.adjust-capacity (param $map (ref $Map)) (param $capacity i32)
	;; the given Map’s original internal array.
	(local $orig (ref $MapInternal))
	;; copy of the Map’s entries, to be used as the Map’s new internal array.
	(local $copy (ref $MapInternal))
	;; index of iteration over original array.
	(local $i i32)
	;; case at index $i in original array.
	(local $case (ref null $Case))

	(local.set $orig (struct.get $Map $internal (local.get $map)))
	(local.set $copy (array.new_default $MapInternal (local.get $capacity)))

	(struct.set $Map $internal (local.get $map) (local.get $copy))

	;; we can’t perform a simple `(array.copy)` because hashing could be different
	;; reset the size, incrementing on iteration
	(struct.set $Map $size (local.get $map) (i32.const 0))
	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $orig))))
			(local.set $case (array.get $MapInternal (local.get $orig) (local.get $i)))
			;; if the case is “live”, put it in the copy and increment the size
			(if
				(i32.and
					(i32.eqz (ref.is_null (local.get $case)))
					(i32.eqz (call $Case.is-tombstone (local.get $case)))
				)
				(then
					(array.set $MapInternal
						(local.get $copy)
						(drop (call $Map.find (local.get $map) (struct.get $Case $ant (local.get $case))))
						(local.get $case)
					)
					(struct.set $Map $size (local.get $map) (i32.add (struct.get $Map $size (local.get $map)) (i32.const 1)))
				)
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
)



;; Set a Map consequent given a antecedent.
;; This method first reallocates if necessary, then adds the consequent.
(func $Map.set (param $map (ref $Map)) (param $ant (ref $Value)) (param $con (ref $Value))
	;; index of the array to set to.
	(local $index i32)
	;; case at the specified index.
	(local $case (ref null $Case))
	;; capacity needed for adjustment.
	(local $new-capacity i32)

	(call $Map.find (local.get $map) (local.get $ant))
	(local.set $case)
	(local.set $index)

	;; if prop is null, we’re adding a new entry. update the capacity, reallocate if necessary, then increment the size.
	;; else if prop is a tombstone or alive, just replace it without incrementing the size.
	(if
		(ref.is_null (local.get $case))
		(then
			(local.set $new-capacity (call $util:capacity-needed (i32.add (struct.get $Map $size (local.get $map)) (i32.const 1))))
			(if
				(i32.lt_u (array.len (struct.get $Map $internal (local.get $map))) (local.get $new-capacity))
				(then
					(call $Map.adjust-capacity (local.get $map) (local.get $new-capacity))
					;; if adjusting the array, local index pointer needs to be reset
					(local.set $index (drop (call $Map.find (local.get $map) (local.get $ant))))
				)
			)
			;; set this after adjusting, as it was reset in the adjustment
			(struct.set $Map $size (local.get $map) (i32.add (struct.get $Map $size (local.get $map)) (i32.const 1)))
		)
	)
	(array.set $MapInternal
		(struct.get $Map $internal (local.get $map))
		(local.get $index)
		(struct.new $Case
			(local.get $ant)
			(local.get $con)
		)
	)
)



;; Delete a Map Case with the given antecedent.
;; If a Case with the given antecedent exists, it is removed and its consequent is returned;
;; otherwise null is returned and the Map is not mutated.
;; This method removes the Case first (if found), then reallocates if necessary.
(func $Map.delete (param $map (ref $Map)) (param $ant (ref $Value)) (result (ref null $Value))
	;; index of the found case in the internal array.
	(local $index i32)
	;; found case at the specified index.
	(local $case (ref null $Case))
	;; capacity needed for adjustment.
	(local $new-capacity i32)

	(call $Map.find (local.get $map) (local.get $ant))
	(local.set $case)
	(local.set $index)

	(if
		(i32.or
			(ref.is_null (local.get $case))
			(call $Case.is-tombstone (local.get $case))
		)
		(then (return (ref.null $Case)))
	)

	;; replace the case with a tombstone
	(array.set $MapInternal
		(struct.get $Map $internal (local.get $map))
		(local.get $index)
		(call $Case.new-tombstone)
	)
	;; capacity adjustment does not occur here. only on insertion.

	(struct.get $Case $con (local.get $case))
)
