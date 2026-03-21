;; Grow a List’s internal array.
;; The number of entries in a List must not exceed its Load Factor: 87.5% (7/8) of its capacity;
;; this method should only be called under that condition.
;; If the List’s count exceeds this percentage, a new array with double the capacity is allocated and assigned.
;; The List’s items are copied over to the new array, preserving the order from the original array.
(func $List.grow (param $list (ref $List))
	;; the given List’s original internal array.
	(local $orig (ref $ListInternal))
	;; copy of the List’s entries, to be used as the List’s new internal array.
	(local $copy (ref $ListInternal))

	(local.set $orig (struct.get $List $internal (local.get $list)))
	(local.set $copy (array.new_default $ListInternal (i32.mul (array.len (local.get $orig)) (i32.const 2))))

	;; assign the new copy to the List
	(struct.set $List $internal (local.get $list) (local.get $copy))

	;; copy the original array’s elements to the new copy
	;; we can use `(array.copy)` because all items are front-packed contiguously and we must preserve order
	(array.copy $ListInternal $ListInternal
		(local.get $copy)
		(i32.const 0)
		(local.get $orig)
		(i32.const 0)
		(array.len (local.get $orig)) ;; the smaller of the two
	)
)



;; Shrink a List’s internal array.
;; An array is doubled in size when its item count reaches 87.5% (7/8) of its capacity (this is the Load Factor);
;; therefore, as a factual result, its item count is never less than 43.75% (7/16) of its capacity.
;; This method should be called when (and only when) this condition occurs when removing items from the array.
;; If the List’s count falls below this minimum percentage, a new array with half the capacity is allocated and assigned.
;; The List’s items are copied over to the new array, preserving the order from the original array.
(func $List.shrink (param $list (ref $List))
	;; the given List’s original internal array.
	(local $orig (ref $ListInternal))
	;; copy of the List’s entries, to be used as the List’s new internal array.
	(local $copy (ref $ListInternal))

	(local.set $orig (struct.get $List $internal (local.get $list)))
	(local.set $copy (array.new_default $ListInternal (i32.div_u (array.len (local.get $orig)) (i32.const 2))))

	;; assign the new copy to the List
	(struct.set $List $internal (local.get $list) (local.get $copy))

	;; copy the original array’s elements to the new copy
	;; we can use `(array.copy)` because all items are front-packed contiguously and we must preserve order
	(array.copy $ListInternal $ListInternal
		(local.get $copy)
		(i32.const 0)
		(local.get $orig)
		(i32.const 0)
		(array.len (local.get $copy)) ;; the smaller of the two
	)
)
