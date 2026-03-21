;; Find a Property in a Dict with the given key.
;; If a Property with the key is found, returns the property and its matching index.
;; Else, returns a null Property with the index that the key hashes to.
;;
;; Useful for get and set operations:
;; - when getting:
;; 	- if a null Property is returned, no entry with the given key exists in the Dict
;; 	- if a non-null Property is returned, its value is what you want
;; - when setting:
;; 	- if a null Property is returned, put the new entry at the returned index
;; 	- if a non-null Property is returned, replace it in the Dict with the new entry
(func $Dict.find (param $dict (ref $Dict)) (param $key i32) (result i32 (ref null $Property))
	;; the given Dict’s internal array.
	(local $internal (ref $DictInternal))
	;; the length of the array. constant.
	(local $ARRLEN i32)
	;; index of the array to retrieve from. increments on each loop until an entry is found.
	(local $index i32)
	;; property at the specified index.
	(local $prop (ref null $Property))

	(local.set $internal (struct.get $Dict $internal (local.get $dict)))
	(local.set $ARRLEN   (array.len (local.get $internal)))
	(local.set $index    (call $mod (local.get $key) (local.get $ARRLEN))) ;; will trap if ARRLEN == 0
	(local.set $prop     (array.get $DictInternal (local.get $internal) (local.get $index)))

	(loop $repeat
		(if (i32.or
			(ref.is_null (local.get $prop))
			(i32.eq (struct.get $Property $key (local.get $prop)) (local.get $key))
		)
			(then (return (local.get $index) (local.get $prop)))
			(else
				;; a load factor of 0.875 (7/8) is enforced; this guarantees some empty slots, so the loop will terminate
				(local.set $index (call $mod (i32.add (local.get $index) (i32.const 1)) (local.get $ARRLEN)))
				(local.set $prop  (array.get $DictInternal (local.get $internal) (local.get $index)))
				(br $repeat)
			)
		)
	)
)



;; Adjust a Dict’s internal array as needed.
;; The number of entries in a Dict must not exceed its Load Factor: 87.5% (7/8) of its capacity.
;; If the Dict’s count exceeds this percentage, a new array with double the capacity is allocated and assigned.
;; Conversely, the number of entries in a Dict must not be less than 43.75% (7/16) of its capacity.
;; If the Dict’s count falls below this minimum percentage, a new array with half the capacity is allocated and assigned.
;; In either case, the Dict’s properties are copied over to the new array, according to the usual key hashing and linear probing technique.
;; There is no guarantee the entries’ positioning and/or order will be preserved.
(func $Dict.adjust-capacity (param $dict (ref $Dict))
	;; the given Dict’s original internal array.
	(local $orig (ref $DictInternal))
	;; original array capacity.
	(local $len i32)
	;; copy of the Dict’s entries, to be used as the Dict’s new internal array.
	(local $copy (ref $DictInternal))
	;; new array capacity. either double or half the old capacity.
	(local $capacity i32)
	;; index of iteration over original array.
	(local $i i32)
	;; property at index $i in original array.
	(local $prop (ref null $Property))

	(local.set $orig (struct.get $Dict $internal (local.get $dict)))
	(local.set $len  (array.len (local.get $orig)))

	(if (i32.ge_u
		(struct.get $Dict $count (local.get $dict))
		;; `$len * 7 / 8` will always be a whole number since `$len` is always a multiple of 8.
		(i32.div_u (i32.mul (local.get $len) (i32.const 7)) (i32.const 8)) ;; MAX_LOAD_FACTOR == 7.0/8.0 == 0.875
	)
		(then (local.set $capacity (i32.mul (local.get $len) (i32.const 2))))
		(else (if (i32.and
			(i32.gt_u (local.get $len) (i32.const 8))
			(i32.lt_u
				(struct.get $Dict $count (local.get $dict))
				;; `$len * 7 / 16` will always be a whole number since `$len` is always a multiple of 16.
				(i32.div_u (i32.mul (local.get $len) (i32.const 7)) (i32.const 16)) ;; MIN_LOAD_FACTOR == 7.0/16.0 == 0.4375
			)
		)
			(then (local.set $capacity (i32.div_u (local.get $len) (i32.const 2))))
		))
	)

	(local.set $copy (array.new_default $DictInternal (local.get $capacity)))

	(struct.set $Dict $internal (local.get $dict) (local.get $copy))

	;; we can’t perform a simple `(array.copy)` because hashing could be different
	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (local.get $len)))
			(local.set $prop (array.get $DictInternal (local.get $orig) (local.get $i)))
			(if (i32.eqz (ref.is_null (local.get $prop)))
				(then (array.set $DictInternal
					(local.get $copy)
					(drop (call $Dict.find (local.get $dict) (struct.get $Property $key (local.get $prop))))
					(local.get $prop)
				))
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
)



;; Set a Dict value given a key.
(func $Dict.set (param $dict (ref $Dict)) (param $key i32) (param $value (ref $Value))
	;; index of the array to set to.
	(local $index i32)
	;; property at the specified index.
	(local $prop (ref null $Property))

	(call $Dict.find (local.get $dict) (local.get $key))
	(local.set $prop)
	(local.set $index)

	(if (ref.is_null (local.get $prop)) ;; TODO: also if prop is tombstone
		(then
			(struct.set $Dict $count (local.get $dict) (i32.add (struct.get $Dict $count (local.get $dict)) (i32.const 1)))
			(call $Dict.adjust-capacity (local.get $dict))
			;; if adjusting the array, local index pointer needs to be reset
			(local.set $index (drop (call $Dict.find (local.get $dict) (local.get $key))))
		)
	)
	(array.set $DictInternal (struct.get $Dict $internal (local.get $dict)) (local.get $index) (struct.new $Property
		(local.get $key)
		(local.get $value)
	))
)
