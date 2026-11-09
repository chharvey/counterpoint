(func $List.count (export "List#count") (param $list (ref $List)) (result i32)
	(struct.get $List $size (local.get $list))
)



(func $List.adjust-capacity (export "List#adjustCapacity") (param $list (ref $List)) (param $capacity i32)
	;; the given List’s original internal array.
	(local $orig (ref $ListArray))
	;; copy of the List’s entries, to be used as the List’s new internal array.
	(local $copy (ref $ListArray))

	(local.set $orig (struct.get $List $internal (local.get $list)))
	(local.set $copy (array.new_default $ListArray (local.get $capacity)))

	(struct.set $List $internal (local.get $list) (local.get $copy))

	;; we can use `(array.copy)` because all items are front-packed contiguously and we must preserve order
	(array.copy $ListArray $ListArray
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
	(local.set $item (array.get $ListArray (struct.get $List $internal (local.get $list)) (local.get $index)))
	(if
		(i32.eqz (ref.is_null (local.get $item)))
		(then (return (ref.as_non_null (local.get $item))))
	)
	(unreachable)
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

	(local.set $item (array.get $ListArray (struct.get $List $internal (local.get $list)) (local.get $index)))

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
	(array.set $ListArray
		(struct.get $List $internal (local.get $list))
		(local.get $index)
		(local.get $value)
	)
)



(func $List.delete (export "List#delete") (param $list (ref $List)) (param $index i32) (result (ref $Value))
	;; the given List’s internal array.
	(local $internal (ref $ListArray))
	;; item at the specified index.
	(local $item (ref $Value))
	;; capacity needed for adjustment.
	(local $new-capacity i32)

	(if
		(i32.ge_u (local.get $index) (struct.get $List $size (local.get $list)))
		(then (unreachable))
	)

	(local.set $internal (struct.get $List $internal (local.get $list)))
	(local.set $item     (ref.as_non_null (array.get $ListArray (local.get $internal) (local.get $index))))

	;; leftward shift (destination index <= source index) is safe
	(array.copy $ListArray $ListArray
		(local.get $internal)
		(local.get $index)
		(local.get $internal)
		(i32.add (local.get $index) (i32.const 1))
		(i32.sub (i32.sub (array.len (local.get $internal)) (local.get $index)) (i32.const 1))
	)
	;; the last item is a left-over duplicate; nullify it
	(array.set $ListArray
		(local.get $internal)
		(i32.sub (struct.get $List $size (local.get $list)) (i32.const 1))
		(ref.null $Value)
	)
	;; capacity adjustment does not occur here. only on insertion.

	(local.get $item)
)



(func $List.copy-from-tuple (export "List#copyFromTuple") (param $dest (ref $List)) (param $src (ref $Tuple))
	(local $dest-internal (ref $ListArray))

	(local.set $dest-internal (struct.get $List $internal (local.get $dest)))

	(call $List.adjust-capacity (local.get $dest) (call $util:capacity-needed (array.len (local.get $src))))
	(array.copy $ListArray $Tuple
		(local.get $dest-internal)
		(i32.const 0)
		(local.get $src)
		(i32.const 0)
		(array.len (local.get $src))
	)
)
(func $List.copy-from-list (export "List#copyFromList") (param $dest (ref $List)) (param $src (ref $List))
	(local $dest-internal (ref $ListArray))
	(local $src-internal  (ref $ListArray))

	(local.set $dest-internal (struct.get $List $internal (local.get $dest)))
	(local.set $src-internal  (struct.get $List $internal (local.get $src)))

	(call $List.adjust-capacity (local.get $dest) (array.len (local.get $src-internal)))
	(array.copy $ListArray $ListArray
		(local.get $dest-internal)
		(i32.const 0)
		(local.get $src-internal)
		(i32.const 0)
		(array.len (local.get $src-internal))
	)
)



(func $List.fill-from-set (export "List#fillFromSet") (param $dest (ref $List)) (param $src (ref $Map))
	(local $src-internal (ref $MapArray))
	(local $j            i32)
	(local $i            i32)
	(local $item         (ref null $Case))

	(local.set $src-internal (struct.get $Map $internal (local.get $src)))
	(local.set $j (i32.const 0))

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $src-internal))))
			(local.set $item (array.get $MapArray (local.get $src-internal) (local.get $i)))
			(if
				(i32.eqz (ref.is_null (local.get $item)))
				(then
					(call $List.set (local.get $dest) (local.get $j) (struct.get $Case $ant (local.get $item)))
					(local.set $j (i32.add (local.get $j) (i32.const 1)))
				)
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
)
