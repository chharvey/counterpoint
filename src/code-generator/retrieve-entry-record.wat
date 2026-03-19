(func $retrieve-entry-record (param $record (ref $Record)) (param $keyid i32) (result (ref $Value))
	;; the length of the given record. constant.
	(local $ARRLEN i32)
	;; tracks the number of loops. if it exceeds the array length, trap
	(local $loop_count i32)
	;; index of the array to retrieve from. increments on each loop until an entry is found
	(local $index i32)
	;; property at the specified index
	(local $prop (ref $Property))

	(local.set $ARRLEN     (array.len (local.get $record)))
	(local.set $loop_count (i32.const 0))
	(local.set $index      (call $mod (local.get $keyid) (local.get $ARRLEN))) ;; will trap if ARRLEN == 0
	(local.set $prop       (array.get $Record (local.get $record) (local.get $index)))

	(loop $repeat
		(if (i32.eq (struct.get $Property $key (local.get $prop)) (local.get $keyid))
			(then (return (struct.get $Property $value (local.get $prop))))
			(else
				(local.set $loop_count (i32.add (local.get $loop_count) (i32.const 1)))
				(if (i32.gt_u (local.get $loop_count) (local.get $ARRLEN))
					(then (unreachable))
				)
				(local.set $index (call $mod (i32.add (local.get $index) (i32.const 1)) (local.get $ARRLEN)))
				(local.set $prop  (array.get $Record (local.get $record) (local.get $index)))
				(br $repeat)
			)
		)
	)
)
