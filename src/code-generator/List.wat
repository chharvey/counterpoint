;; Returns the number of “live” elements in the List.
;; Since lists are contiguously front-packed and contain no tombstones,
;; this should always be equal to the List’s size.
(func $List.count (param $list (ref $List)) (result i32)
	(struct.get $List $size (local.get $list))
)



;; Reallocate a List’s internal array as needed, adjusting for size.
;; The List’s items are copied over to the new array, preserving the order from the original array.
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

	(if
		(i32.gt_u (local.get $index) (struct.get $List $size (local.get $list)))
		(then (unreachable))
	)

	(local.set $item (array.get $ListInternal (struct.get $List $internal (local.get $list)) (local.get $index)))

	(if
		(ref.is_null (local.get $item))
		(then
			(local.set $new-capacity (call $capacity-needed (i32.add (struct.get $List $size (local.get $list)) (i32.const 1))))
			(if
				(i32.lt_u (array.len (struct.get $List $internal (local.get $list))) (local.get $new-capacity))
				(then (call $List.adjust-capacity (local.get $list) (local.get $new-capacity)))
			)
			;; set this after adjusting, to mirror `$Dict.set`
			(struct.set $List $size (local.get $list) (i32.add (struct.get $List $size (local.get $list)) (i32.const 1)))
		)
	)
	(array.set $ListInternal
		(struct.get $List $internal (local.get $list))
		(local.get $index)
		(local.get $value)
	)
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

	(if
		(i32.ge_u (local.get $index) (struct.get $List $size (local.get $list)))
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
	;; capacity adjustment does not occur here. only on insertion.

	(local.get $item)
)



;; Returns whether two Lists are equal —
;; whether they have equal items at the same indices.
(func $List.equal (param $list0 (ref $List)) (param $list1 (ref $List)) (result i32)
	(local $i         i32)
	(local $internal0 (ref $ListInternal))
	(local $internal1 (ref $ListInternal))
	(local $item0     (ref null $Value))
	(local $item1     (ref null $Value))

	;; Lists that are identical are always equal
	(if
		(ref.eq (local.get $list0) (local.get $list1)) ;; using `ref.eq` instead of `vid` since they’re already unwrapped
		(then (return (i32.const 1)))
	)

	;; compare $List.$size since two equal Lists may have different internal array lengths
	(if
		(i32.ne (struct.get $List $size (local.get $list0)) (struct.get $List $size (local.get $list1)))
		(then (return (i32.const 0)))
	)

	(local.set $internal0 (struct.get $List $internal (local.get $list0)))
	(local.set $internal1 (struct.get $List $internal (local.get $list1)))

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $internal0))))
			(local.set $item0 (array.get $ListInternal (local.get $internal0) (local.get $i)))
			(local.set $item1 (array.get $ListInternal (local.get $internal1) (local.get $i)))

			;; if they’re both null, we’ve reached the end of all live items; the Lists are equal; return true
			(if
				(i32.and
					(ref.is_null (local.get $item0))
					(ref.is_null (local.get $item1))
				)
				(then (return (i32.const 1)))
			)

			;; if exactly one of them is null, or neither of them is null and they’re not equal, return false
			(if
				(i32.or
					(i32.or
						(i32.and
							(ref.is_null (local.get $item0))
							(i32.eqz (ref.is_null (local.get $item1)))
						)
						(i32.and
							(i32.eqz (ref.is_null (local.get $item0)))
							(ref.is_null (local.get $item1))
						)
					)
					(i32.and
						(i32.and
							(i32.eqz (ref.is_null (local.get $item0)))
							(i32.eqz (ref.is_null (local.get $item1)))
						)
						(i32.eqz (call $bool-to-i32 (call $veq
							(ref.cast (ref $Value) (local.get $item0))
							(ref.cast (ref $Value) (local.get $item1))
						)))
					)
				)
				(then (return (i32.const 0)))
			)

			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
	(i32.const 1)
)
