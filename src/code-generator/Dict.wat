;; Get the value in a record at the given key.
(func $Dict.get (param $dict (ref $Dict)) (param $key i32) (result (ref null $Value))
	;; the given Dict’s internal array.
	(local $internal (ref $DictInternal))
	;; the length of the array. constant.
	(local $ARRLEN i32)
	;; tracks the number of loops. if it exceeds the array length, trap.
	(local $loop-count i32)
	;; index of the array to retrieve from. increments on each loop until an entry is found.
	(local $index i32)
	;; property at the specified index.
	(local $prop (ref null $Property))

	(local.set $internal   (struct.get $Dict $internal (local.get $dict)))
	(local.set $ARRLEN     (array.len (local.get $internal)))
	(local.set $loop-count (i32.const 0))
	(local.set $index      (call $mod (local.get $key) (local.get $ARRLEN))) ;; will trap if ARRLEN == 0
	(local.set $prop       (array.get $DictInternal (local.get $internal) (local.get $index)))

	(loop $repeat
		(if (ref.is_null (local.get $prop))
			(then (return (ref.null $Value)))
			(else
				(if (i32.eq (struct.get $Property $key (local.get $prop)) (local.get $key))
					(then (return (struct.get $Property $value (local.get $prop))))
					(else
						(local.set $loop-count (i32.add (local.get $loop-count) (i32.const 1)))
						(if (i32.gt_u (local.get $loop-count) (local.get $ARRLEN))
							(then (unreachable)) ;; TODO: enforce load factor of 0.875 (7/8); that will guarantee some empty slots; then remove loop-count
						)
						(local.set $index (call $mod (i32.add (local.get $index) (i32.const 1)) (local.get $ARRLEN)))
						(local.set $prop  (array.get $DictInternal (local.get $internal) (local.get $index)))
						(br $repeat)
					)
				)
			)
		)
	)
)
