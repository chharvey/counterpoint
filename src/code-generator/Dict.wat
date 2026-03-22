;; Returns the number of “live” elements in the Dict.
;; “Live” elements are non-null, non-tombstone properties.
(func $Dict.count (param $dict (ref $Dict)) (result i32)
	;; the return value, the number of live elements.
	(local $count i32)
	;; the Dict’s internal array.
	(local $internal (ref $DictInternal))
	;; index of iteration.
	(local $i i32)
	;; object of iteration.
	(local $prop (ref null $Property))

	(local.set $count    (i32.const 0))
	(local.set $internal (struct.get $Dict $internal (local.get $dict)))

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $internal))))
			(local.set $prop (array.get $DictInternal (local.get $internal) (local.get $i)))
			;; if the property is non-null and not a tombstone, increment the count
			(if (i32.and
				(i32.eqz (ref.is_null (local.get $prop)))
				(i32.eqz (call $Property.is-tombstone (local.get $prop)))
			)
				(then (local.set $count (i32.add (local.get $count) (i32.const 1))))
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
	(local.get $count)
)



;; Find a Property in a Dict with the given key.
;; If a Property with the key is found, returns the property and its matching index.
;; Else, returns a null Property or tombstone with the index that the key hashes to.
;;
;; Useful for get, set, and delete operations:
;; - when getting:
;; 	- if null or a “tombstone” is returned, no entry with the given key exists in the Dict
;; 	- if a non-null, “live” Property is returned, its value is what you want
;; - when setting:
;; 	- if null is returned, it means you’re adding a new property; you should put the new entry at the returned index and increment the Dict’s size
;; 	- if a “tombstone” or a non-null, “live” Property is returned, you should replace it with the new entry, but *do not* increment the Dict’s size
;; - when deleting:
;; 	- if null or a “tombstone” is returned, it means the key wasn’t found and the Dict was not mutated; *do not* change the Dict’s size
;; 	- if a non-null, “live” Property is returned, it was deleted from the Dict and replaced with a tombstone; *do not* change the Dict’s size (as tombstones are still counted)
(func $Dict.find (param $dict (ref $Dict)) (param $key i32) (result i32 (ref null $Property))
	;; the given Dict’s internal array.
	(local $internal (ref $DictInternal))
	;; the length of the array. constant.
	(local $ARRLEN i32)
	;; index of the array to retrieve from. increments on each loop until an entry or null is found.
	(local $index i32)
	;; property at the specified index.
	(local $prop (ref null $Property))
	;; the index and object of the first tombstone we’ve passed, if any.
	;; if the key is not in the dict and `$tombprop` is set,
	;; return it and `$tombidx` instead of the current prop and index of iteration.
	;; this will tell callers of `$Dict.set` that we’re reusing a tombstone, so incrementing `$size` should not be done.
	(local $tombidx  i32)
	(local $tombprop (ref null $Property))

	(local.set $internal (struct.get $Dict $internal (local.get $dict)))
	(local.set $ARRLEN   (array.len (local.get $internal)))
	(local.set $index    (call $mod (local.get $key) (local.get $ARRLEN))) ;; will trap if ARRLEN == 0
	(local.set $prop     (array.get $DictInternal (local.get $internal) (local.get $index)))
	(local.set $tombidx  (i32.const -1))
	(local.set $tombprop (ref.null $Property))

	(loop $repeat
		;; if the current property is null, the key is definitely not in the Dict.
		;; if we’ve passed a tombstone, return it and its index.
		;; otherwise, return the current null property and its index.
		(if (ref.is_null (local.get $prop))
			(then (return (if (result i32 (ref null $Property)) (ref.is_null (local.get $tombprop))
				(then (local.get $index)   (local.get $prop))
				(else (local.get $tombidx) (local.get $tombprop))
			)))
			;; else the current property is either a tombstone or a “live” property. compare the keys.
			(else (if (i32.eq (struct.get $Property $key (local.get $prop)) (local.get $key))
				;; if the keys match, we have our result.
				(then (return (local.get $index) (local.get $prop)))
				;; else if the current property is a tombstone, store it, then continue the search.
				(else
					(if (call $Property.is-tombstone (local.get $prop))
						(then
							(local.set $tombidx  (local.get $index))
							(local.set $tombprop (local.get $prop))
						)
					)
					;; a load factor is enforced; this guarantees some empty slots, so the loop is guaranteed to terminate
					(local.set $index (call $mod (i32.add (local.get $index) (i32.const 1)) (local.get $ARRLEN)))
					(local.set $prop  (array.get $DictInternal (local.get $internal) (local.get $index)))
					(br $repeat)
				)
			))
		)
	)
)



;; Adjust a Dict’s internal array as needed.
;; The number of entries in a Dict must not exceed its Load Factor: 87.5% (7/8) of its capacity.
;; If the Dict’s size exceeds this percentage, a new array with double the capacity is allocated and assigned.
;; Conversely, the number of entries in a Dict must not be less than 43.75% (7/16) of its capacity.
;; If the Dict’s size falls below this minimum percentage, a new array with half the capacity is allocated and assigned.
;; In either case, the Dict’s “live” (non-tombstone) properties are copied over to the new array,
;; according to the usual key hashing and linear probing technique, and its size and count are updated.
;; There is no guarantee the entries’ positioning and/or order will be preserved.
(func $Dict.adjust-capacity (param $dict (ref $Dict)) (param $capacity i32)
	;; the given Dict’s original internal array.
	(local $orig (ref $DictInternal))
	;; copy of the Dict’s entries, to be used as the Dict’s new internal array.
	(local $copy (ref $DictInternal))
	;; index of iteration over original array.
	(local $i i32)
	;; property at index $i in original array.
	(local $prop (ref null $Property))

	(local.set $orig (struct.get $Dict $internal (local.get $dict)))
	(local.set $copy (array.new_default $DictInternal (local.get $capacity)))

	(struct.set $Dict $internal (local.get $dict) (local.get $copy))

	;; we can’t perform a simple `(array.copy)` because hashing could be different
	;; reset the size, incrementing on iteration
	(struct.set $Dict $size (local.get $dict) (i32.const 0))
	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $orig))))
			(local.set $prop (array.get $DictInternal (local.get $orig) (local.get $i)))
			;; if the property is “live”, put it in the copy and increment the size
			(if (i32.and
				(i32.eqz (ref.is_null (local.get $prop)))
				(i32.eqz (call $Property.is-tombstone (local.get $prop)))
			)
				(then
					(array.set $DictInternal
						(local.get $copy)
						(drop (call $Dict.find (local.get $dict) (struct.get $Property $key (local.get $prop))))
						(local.get $prop)
					)
					(struct.set $Dict $size (local.get $dict) (i32.add (struct.get $Dict $size (local.get $dict)) (i32.const 1)))
				)
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
)



;; Set a Dict value given a key.
;; This method first reallocates if necessary, then adds the value.
(func $Dict.set (param $dict (ref $Dict)) (param $key i32) (param $value (ref $Value))
	;; index of the array to set to.
	(local $index i32)
	;; property at the specified index.
	(local $prop (ref null $Property))
	;; capacity needed for adjustment.
	(local $new-capacity i32)

	(call $Dict.find (local.get $dict) (local.get $key))
	(local.set $prop)
	(local.set $index)

	;; if prop is null, we’re adding a new entry. update the capacity, reallocate if necessary, then increment the size.
	;; else if prop is a tombstone or alive, just replace it without incrementing the size.
	(if (ref.is_null (local.get $prop))
		(then
			(local.set $new-capacity (call $capacity-needed (i32.add (struct.get $Dict $size (local.get $dict)) (i32.const 1))))
			(if (i32.ne (array.len (struct.get $Dict $internal (local.get $dict))) (local.get $new-capacity))
				(then
					(call $Dict.adjust-capacity (local.get $dict) (local.get $new-capacity))
					;; if adjusting the array, local index pointer needs to be reset
					(local.set $index (drop (call $Dict.find (local.get $dict) (local.get $key))))
				)
			)
			;; set this after adjusting, as it was reset in the adjustment
			(struct.set $Dict $size (local.get $dict) (i32.add (struct.get $Dict $size (local.get $dict)) (i32.const 1)))
		)
	)
	(array.set $DictInternal (struct.get $Dict $internal (local.get $dict)) (local.get $index) (struct.new $Property
		(local.get $key)
		(local.get $value)
	))
)



;; Delete a Dict property with the given key.
;; If a property with the given key exists, it is removed and returned;
;; otherwise null is returned and the Dict is not mutated.
;; This method removes the property first (if found), then reallocates if necessary.
(func $Dict.delete (param $dict (ref $Dict)) (param $key i32) (result (ref null $Property))
	;; the given Dict’s internal array.
	(local $internal (ref $DictInternal))
	;; index of the found property in the internal array.
	(local $index i32)
	;; found property at the specified index.
	(local $prop (ref null $Property))
	;; capacity needed for adjustment.
	(local $new-capacity i32)

	(local.set $internal (struct.get $Dict $internal (local.get $dict)))
	(call $Dict.find (local.get $dict) (local.get $key))
	(local.set $prop)
	(local.set $index)

	(if (i32.or
		(ref.is_null (local.get $prop))
		(call $Property.is-tombstone (local.get $prop))
	)
		(then (return (ref.null $Property)))
	)

	;; replace the property with a tombstone
	(array.set $DictInternal
		(local.get $internal)
		(local.get $index)
		(struct.new $Property
			(i32.const -1)
			(struct.new_default $Value)
		)
	)
	;; tombstones still contribute to the Dict’s size, so do not decrement it here. size will be recomputed on reallocation.
	;; FIXME: call $capacity-needed with count, not size
	;; (local.set $new-capacity (call $capacity-needed (i32.sub (struct.get $Dict $size (local.get $dict)) (i32.const 1))))
	;; (if (i32.ne (array.len (local.get $internal)) (local.get $new-capacity))
	;; 	(then (call $Dict.adjust-capacity (local.get $dict) (local.get $new-capacity)))
	;; )

	(local.get $prop)
)
