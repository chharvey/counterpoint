;; Adjust a List’s internal array as needed.
;; The number of entries in a List must not exceed its Load Factor: 87.5% (7/8) of its capacity.
;; If the List’s count exceeds this percentage, a new array with double the capacity is allocated and assigned.
;; Conversely, the number of entries in a List must not be less than 43.75% (7/16) of its capacity.
;; If the List’s count falls below this minimum percentage, a new array with half the capacity is allocated and assigned.
;; In either case, the List’s items are copied over to the new array, preserving the order from the original array.
(func $List.adjust-capacity (param $list (ref $List))
	;; the given List’s original internal array.
	(local $orig (ref $ListInternal))
	;; original array capacity.
	(local $len i32)
	;; copy of the List’s entries, to be used as the List’s new internal array.
	(local $copy (ref $ListInternal))
	;; new array capacity. either double or half the old capacity.
	(local $capacity i32)

	(local.set $orig (struct.get $List $internal (local.get $list)))
	(local.set $len  (array.len (local.get $orig)))

	(if (i32.ge_u
		(struct.get $List $count (local.get $list))
		;; `$len * 7 / 8` will always be a whole number since `$len` is always a multiple of 8.
		(i32.div_u (i32.mul (local.get $len) (i32.const 7)) (i32.const 8)) ;; MAX_LOAD_FACTOR == 7.0/8.0 == 0.875
	)
		(then (local.set $capacity (i32.mul (local.get $len) (i32.const 2))))
		(else (if (i32.and
			(i32.gt_u (local.get $len) (i32.const 8))
			(i32.lt_u
				(struct.get $List $count (local.get $list))
				;; `$len * 7 / 16` will always be a whole number since `$len` is always a multiple of 16.
				(i32.div_u (i32.mul (local.get $len) (i32.const 7)) (i32.const 16)) ;; MIN_LOAD_FACTOR == 7.0/16.0 == 0.4375
			)
		)
			(then (local.set $capacity (i32.div_u (local.get $len) (i32.const 2))))
		))
	)

	(local.set $copy (array.new_default $ListInternal (local.get $capacity)))

	(struct.set $List $internal (local.get $list) (local.get $copy))

	;; we can use `(array.copy)` because all items are front-packed contiguously and we must preserve order
	(array.copy $ListInternal $ListInternal
		(local.get $copy)
		(i32.const 0)
		(local.get $orig)
		(i32.const 0)
		(array.len (local.get $orig))
	)
)



;; Set a List value given an index.
;; The provided index must be less than or equal to the List’s count.
;; (‘Equal to’ is allowed when appending to the List.)
(func $List.set (param $list (ref $List)) (param $index i32) (param $value (ref $Value))
	;; item at the specified index.
	(local $item (ref null $Value))

	(if (i32.gt_u (local.get $index) (struct.get $List $count (local.get $list)))
		(then (unreachable))
	)

	(local.set $item (array.get $ListInternal (struct.get $List $internal (local.get $list)) (local.get $index)))

	(if (ref.is_null (local.get $item)) ;; TODO: also if item is tombstone
		(then
			(struct.set $List $count (local.get $list) (i32.add (struct.get $List $count (local.get $list)) (i32.const 1)))
			(call $List.adjust-capacity (local.get $list))
		)
	)
	(array.set $ListInternal (struct.get $List $internal (local.get $list)) (local.get $index) (local.get $value))
)
