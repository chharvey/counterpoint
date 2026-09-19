(func $List.count (export "List#count") (param $list (ref $List)) (result i32)
	(struct.get $List $size (local.get $list))
)



(func $List.adjust-capacity (export "List#adjustCapacity") (param $list (ref $List)) (param $capacity i32)
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



(func $List.get (export "List#get") (param $list (ref $List)) (param $index i32) (result (ref $Value))
	;; item at the specified index.
	(local $item (ref null $Value))
	(local.set $item (array.get $ListInternal (struct.get $List $internal (local.get $list)) (local.get $index)))
	(if (result (ref $Value))
		(ref.is_null (local.get $item))
		(then (call $Value.new-primitive (global.get $Vect.NULL)))
		(else (ref.as_non_null (local.get $item)))
	)
)



(func $List.set (export "List#set") (param $list (ref $List)) (param $index i32) (param $value (ref $Value))
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
			(local.set $new-capacity (call $util:capacity-needed (i32.add (struct.get $List $size (local.get $list)) (i32.const 1))))
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



(func $List.delete (export "List#delete") (param $list (ref $List)) (param $index i32) (result (ref $Value))
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
