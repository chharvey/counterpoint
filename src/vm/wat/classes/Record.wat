;; Return whether the given record has a property amongst its entries with the given key.
(func $Record.has-key (param $record (ref $Record)) (param $key i64) (result i32)
	(local $i i32)

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $record))))
			(if
				(i64.eq
					(struct.get $Property $key (array.get $Record (local.get $record) (local.get $i)))
					(local.get $key)
				)
				(then (return (i32.const 1)))
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
	(i32.const 0)
)



(func $Record.get (export "Record#get") (param $record (ref $Record)) (param $key i64) (result (ref $Value))
	;; the length of the given record. constant.
	(local $ARRLEN i32)
	;; tracks the number of loops. if it exceeds the array length, trap.
	(local $loop-count i32)
	;; index of the array to retrieve from. increments on each loop until an entry is found.
	(local $index i32)
	;; property at the specified index.
	(local $prop (ref $Property))

	(local.set $ARRLEN     (array.len (local.get $record)))
	(local.set $loop-count (i32.const 0))
	(local.set $index      (call $util:mod (i32.wrap_i64 (local.get $key)) (local.get $ARRLEN))) ;; will trap if ARRLEN == 0

	(loop $repeat
		(local.set $prop (array.get $Record (local.get $record) (local.get $index)))
		(if
			(i64.eq (struct.get $Property $key (local.get $prop)) (local.get $key))
			(then (return (struct.get $Property $val (local.get $prop))))
		)
		(local.set $loop-count (i32.add (local.get $loop-count) (i32.const 1)))
		(if
			;; there are no empty slots in records, so we it’s possible for a given key to collide with all entries
			;; after exhausting all entries, trap
			(i32.gt_u (local.get $loop-count) (local.get $ARRLEN))
			(then (unreachable))
		)
		(local.set $index (call $util:mod (i32.add (local.get $index) (i32.const 1)) (local.get $ARRLEN)))
		(br $repeat)
	)
)
