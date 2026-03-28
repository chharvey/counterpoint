;; Returns whether two tuples are identical by value —
;; whether they have identical items at the same indices.
(func $Tuple.identical (param $tuple0 (ref $Tuple)) (param $tuple1 (ref $Tuple)) (result i32)
	(local $i i32)

	(if (i32.ne (array.len (local.get $tuple0)) (array.len (local.get $tuple1)))
		(then (return (i32.const 0)))
	)

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $tuple0))))
			(if (i32.eqz (call $bool-to-i32 (call $vid_
				(array.get $Tuple (local.get $tuple0) (local.get $i))
				(array.get $Tuple (local.get $tuple1) (local.get $i))
			)))
				(then (return (i32.const 0)))
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
	(i32.const 1)
)



;; Returns whether two tuples are equal —
;; whether they have equal items at the same indices.
(func $Tuple.equal (param $tuple0 (ref $Tuple)) (param $tuple1 (ref $Tuple)) (result i32)
	(local $i i32)

	(if (i32.ne (array.len (local.get $tuple0)) (array.len (local.get $tuple1)))
		(then (return (i32.const 0)))
	)

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $tuple0))))
			(if (i32.eqz (call $bool-to-i32 (call $veq_
				(array.get $Tuple (local.get $tuple0) (local.get $i))
				(array.get $Tuple (local.get $tuple1) (local.get $i))
			)))
				(then (return (i32.const 0)))
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
	(i32.const 1)
)
