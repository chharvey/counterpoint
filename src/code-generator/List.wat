;; Returns the number of “live” elements in the List.
;; Since lists are contiguously front-packed and contain no tombstones,
;; this should always be equal to the List’s size.
(func $List.count (param $list (ref $List)) (result i32)
	(struct.get $List $size (local.get $list))
)



;; Adjust a List’s internal array as needed.
;; The number of entries in a List must not exceed its Load Factor: 87.5% (7/8) of its capacity.
;; If the List’s size exceeds this percentage, a new array with double the capacity is allocated and assigned.
;; Conversely, the number of entries in a List must not be less than 43.75% (7/16) of its capacity.
;; If the List’s size falls below this minimum percentage, a new array with half the capacity is allocated and assigned.
;; In either case, the List’s items are copied over to the new array, preserving the order from the original array.
(func $List.adjust-capacity (param $list (ref $List)) (param $capacity i32)
	;; the given List’s original internal array.
	(local $orig (ref $ListInternal))
	;; copy of the List’s entries, to be used as the List’s new internal array.
	(local $copy (ref $ListInternal))

	(local.set $orig (struct.get $List $internal (local.get $list)))
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
;; The provided index must be non-negative and less than or equal to the List’s count.
;; (‘Equal to’ is allowed when appending to the List.)
;; This method first reallocates if necessary, then adds the item.
(func $List.set (param $list (ref $List)) (param $index i32) (param $value (ref $Value))
	;; item at the specified index.
	(local $item (ref null $Value))
	;; capacity needed for adjustment.
	(local $new-capacity i32)

	(if (i32.gt_u (local.get $index) (call $List.count (local.get $list)))
		(then (unreachable))
	)

	(local.set $item (array.get $ListInternal (struct.get $List $internal (local.get $list)) (local.get $index)))

	(if (ref.is_null (local.get $item))
		(then
			(local.set $new-capacity (call $capacity-needed (i32.add (call $List.count (local.get $list)) (i32.const 1))))
			(if (i32.ne (array.len (struct.get $List $internal (local.get $list))) (local.get $new-capacity))
				(then (call $List.adjust-capacity (local.get $list) (local.get $new-capacity)))
			)
			;; set this after adjusting, to mirror `$Dict.set`
			(struct.set $List $size (local.get $list) (i32.add (struct.get $List $size (local.get $list)) (i32.const 1)))
		)
	)
	(array.set $ListInternal (struct.get $List $internal (local.get $list)) (local.get $index) (local.get $value))
)



;; Delete a List item at the given index.
;; The provided index must be non-negative and strictly less than the List’s count.
;; Shifts all subsequent items to the front, and returns the deleted item.
;; This method removes the item first, then reallocates if necessary.
(func $List.delete (param $list (ref $List)) (param $index i32) (result (ref $Value))
	;; the given List’s internal array.
	(local $internal (ref $ListInternal))
	;; item at the specified index.
	(local $item (ref $Value))
	;; capacity needed for adjustment.
	(local $new-capacity i32)

	(if (i32.ge_u (local.get $index) (call $List.count (local.get $list)))
		(then (unreachable))
	)

	(local.set $internal (struct.get $List $internal (local.get $list)))
	(local.set $item     (ref.as_non_null (array.get $ListInternal (local.get $internal) (local.get $index))))

	;; leftward shift (destination index <= source index) is safe
	(array.copy $ListInternal $ListInternal
		(local.get $internal)
		(local.get $index)
		(local.get $internal)
		(i32.add (local.get $index) (i32.const 1))
		(i32.sub (i32.sub (array.len (local.get $internal)) (local.get $index)) (i32.const 1))
	)
	;; the last item is a left-over duplicate; nullify it
	(array.set $ListInternal
		(local.get $internal)
		(i32.sub (struct.get $List $size (local.get $list)) (i32.const 1))
		(ref.null $Value)
	)

	;; set this before adjusting, since there is no parallel in `$Dict.delete`
	(struct.set $List $size (local.get $list) (i32.sub (struct.get $List $size (local.get $list)) (i32.const 1)))
	(local.set $new-capacity (call $capacity-needed (call $List.count (local.get $list))))
	(if (i32.ne (array.len (local.get $internal)) (local.get $new-capacity))
		(then (call $List.adjust-capacity (local.get $list) (local.get $new-capacity)))
	)

	(local.get $item)
)
