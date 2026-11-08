(func $Dict.count (export "Dict#count") (param $dict (ref $Dict)) (result i32)
	;; the return value, the number of live elements.
	(local $count i32)
	;; the Dict’s internal array.
	(local $internal (ref $DictInternal))
	;; index of iteration.
	(local $i i32)
	;; object of iteration.
	(local $prop (ref null $Property))

	(local.set $count    (i32.const 0))
	(local.set $internal (struct.get $Dict $internal (local.get $dict)))

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $internal))))
			(local.set $prop (array.get $DictInternal (local.get $internal) (local.get $i)))
			;; if the property is “live”, increment the count
			(if
				(i32.and
					(i32.eqz (ref.is_null (local.get $prop)))
					(i32.eqz (ref.eq (local.get $prop) (global.get $Property.TOMBSTONE)))
				)
				(then (local.set $count (i32.add (local.get $count) (i32.const 1))))
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
	(local.get $count)
)



(func $Dict.find (export "Dict#find") (param $dict (ref $Dict)) (param $key i64) (result i32 (ref null $Property))
	;; the given Dict’s internal array.
	(local $internal (ref $DictInternal))
	;; the length of the array. constant.
	(local $ARRLEN i32)
	;; index of the array to retrieve from. increments on each loop until an entry or null is found.
	(local $index i32)
	;; property at the specified index.
	(local $prop (ref null $Property))
	;; the index and object of the first tombstone we’ve passed, if any.
	;; if the key is not in the Dict and `$tombprop` is set,
	;; return it and `$tombidx` instead of the current prop and index of iteration.
	;; this will tell callers of `$Dict.set` that we’re reusing a tombstone, so incrementing `$size` should not be done.
	(local $tombidx  i32)
	(local $tombprop (ref null $Property))

	(local.set $internal (struct.get $Dict $internal (local.get $dict)))
	(local.set $ARRLEN   (array.len (local.get $internal)))
	(local.set $index    (call $util:mod (i32.wrap_i64 (local.get $key)) (local.get $ARRLEN))) ;; will trap if ARRLEN == 0
	(local.set $tombidx  (i32.const -1))
	(local.set $tombprop (ref.null $Property))

	(loop $repeat
		(local.set $prop (array.get $DictInternal (local.get $internal) (local.get $index)))
		;; if the current property is null, the key is definitely not in the Dict.
		;; if we’ve passed a tombstone, return it and its index.
		;; otherwise, return the current null property and its index.
		(if
			(ref.is_null (local.get $prop))
			(then (return (if (result i32 (ref null $Property))
				(ref.is_null (local.get $tombprop))
				(then (local.get $index)   (local.get $prop))
				(else (local.get $tombidx) (local.get $tombprop))
			)))
		)
		;; if the keys match, we have our result.
		(if
			(i64.eq (struct.get $Property $key (local.get $prop)) (local.get $key))
			(then (return (local.get $index) (local.get $prop)))
		)
		;; if the current property is a tombstone, store it, then continue the search.
		(if
			(ref.eq (local.get $prop) (global.get $Property.TOMBSTONE))
			(then
				(local.set $tombidx  (local.get $index))
				(local.set $tombprop (local.get $prop))
			)
		)
		;; a load factor is enforced; this guarantees some empty slots, so the loop is guaranteed to terminate
		(local.set $index (call $util:mod (i32.add (local.get $index) (i32.const 1)) (local.get $ARRLEN)))
		(br $repeat)
	)
)



(func $Dict.adjust-capacity (export "Dict#adjustCapacity") (param $dict (ref $Dict)) (param $capacity i32)
	;; the given Dict’s original internal array.
	(local $orig (ref $DictInternal))
	;; copy of the Dict’s entries, to be used as the Dict’s new internal array.
	(local $copy (ref $DictInternal))
	;; index of iteration over original array.
	(local $i i32)
	;; property at index $i in original array.
	(local $prop (ref null $Property))

	(local.set $orig (struct.get $Dict $internal (local.get $dict)))
	(local.set $copy (array.new_default $DictInternal (local.get $capacity)))

	(struct.set $Dict $internal (local.get $dict) (local.get $copy))

	;; we can’t perform a simple `(array.copy)` because hashing could be different
	;; reset the size, incrementing on iteration
	(struct.set $Dict $size (local.get $dict) (i32.const 0))
	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $orig))))
			(local.set $prop (array.get $DictInternal (local.get $orig) (local.get $i)))
			;; if the property is “live”, put it in the copy and increment the size
			(if
				(i32.and
					(i32.eqz (ref.is_null (local.get $prop)))
					(i32.eqz (ref.eq (local.get $prop) (global.get $Property.TOMBSTONE)))
				)
				(then
					(array.set $DictInternal
						(local.get $copy)
						(drop (call $Dict.find (local.get $dict) (struct.get $Property $key (local.get $prop))))
						(local.get $prop)
					)
					(struct.set $Dict $size (local.get $dict) (i32.add (struct.get $Dict $size (local.get $dict)) (i32.const 1)))
				)
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
)



(func $Dict.get (export "Dict#get") (param $dict (ref $Dict)) (param $key i64) (result (ref $Value))
	;; property at the specified key.
	(local $prop (ref null $Property))
	(drop (local.set $prop (call $Dict.find (local.get $dict) (local.get $key))))
	(if
		(i32.eqz (i32.or
			(ref.is_null (local.get $prop))
			(ref.eq (local.get $prop) (global.get $Property.TOMBSTONE))
		))
		(then (return (struct.get $Property $val (local.get $prop))))
	)
	(unreachable)
)



(func $Dict.set (export "Dict#set") (param $dict (ref $Dict)) (param $key i64) (param $val (ref $Value))
	;; index of the array to set to.
	(local $index i32)
	;; property at the specified key.
	(local $prop (ref null $Property))
	;; capacity needed for adjustment.
	(local $new-capacity i32)

	(local.set $index (local.set $prop (call $Dict.find (local.get $dict) (local.get $key))))

	;; if prop is null, we’re adding a new entry. update the capacity, reallocate if necessary, then increment the size.
	;; else if prop is a tombstone or alive, just replace it without incrementing the size.
	(if
		(ref.is_null (local.get $prop))
		(then
			(local.set $new-capacity (call $util:capacity-needed (i32.add (struct.get $Dict $size (local.get $dict)) (i32.const 1))))
			(if
				(i32.lt_u (array.len (struct.get $Dict $internal (local.get $dict))) (local.get $new-capacity))
				(then
					(call $Dict.adjust-capacity (local.get $dict) (local.get $new-capacity))
					;; if adjusting the array, local index pointer needs to be reset
					(local.set $index (drop (call $Dict.find (local.get $dict) (local.get $key))))
				)
			)
			;; set this after adjusting, as it was reset in the adjustment
			(struct.set $Dict $size (local.get $dict) (i32.add (struct.get $Dict $size (local.get $dict)) (i32.const 1)))
		)
	)
	(array.set $DictInternal
		(struct.get $Dict $internal (local.get $dict))
		(local.get $index)
		(struct.new $Property
			(local.get $key)
			(local.get $val)
		)
	)
)



(func $Dict.delete (export "Dict#delete") (param $dict (ref $Dict)) (param $key i64) (result (ref null $Value))
	;; index of the found property in the internal array.
	(local $index i32)
	;; found property at the specified index.
	(local $prop (ref null $Property))
	;; capacity needed for adjustment.
	(local $new-capacity i32)

	(local.set $index (local.set $prop (call $Dict.find (local.get $dict) (local.get $key))))

	(if
		(i32.or
			(ref.is_null (local.get $prop))
			(ref.eq (local.get $prop) (global.get $Property.TOMBSTONE))
		)
		(then (return (ref.null $Value)))
	)

	;; replace the property with a tombstone
	(array.set $DictInternal
		(struct.get $Dict $internal (local.get $dict))
		(local.get $index)
		(global.get $Property.TOMBSTONE)
	)
	;; capacity adjustment does not occur here. only on insertion.

	(struct.get $Property $val (local.get $prop))
)



(func $Dict.copy-from-record (export "Dict#copyFromRecord") (param $dest (ref $Dict)) (param $src (ref $Record))
	(local $dest-internal (ref $DictInternal))
	(local $src-internal  (ref $RecordInternal))

	(local.set $dest-internal (struct.get $Dict   $internal (local.get $dest)))
	(local.set $src-internal  (struct.get $Record $internal (local.get $src)))

	(call $Dict.adjust-capacity (local.get $dest) (call $util:capacity-needed (array.len (local.get $src-internal))))
	(array.copy $DictInternal $RecordInternal
		(local.get $dest-internal)
		(i32.const 0)
		(local.get $src-internal)
		(i32.const 0)
		(array.len (local.get $src-internal))
	)
)
(func $Dict.copy-from-dict (export "Dict#copyFromDict") (param $dest (ref $Dict)) (param $src (ref $Dict))
	(local $dest-internal (ref $DictInternal))
	(local $src-internal  (ref $DictInternal))

	(local.set $dest-internal (struct.get $Dict $internal (local.get $dest)))
	(local.set $src-internal  (struct.get $Dict $internal (local.get $src)))

	(call $Dict.adjust-capacity (local.get $dest) (array.len (local.get $src-internal)))
	(array.copy $DictInternal $DictInternal
		(local.get $dest-internal)
		(i32.const 0)
		(local.get $src-internal)
		(i32.const 0)
		(array.len (local.get $src-internal))
	)
)



(func $Dict.fill-from-tuple (export "Dict#fillFromTuple") (param $dest (ref $Dict)) (param $src (ref $Tuple))
	(local $src-internal (ref $TupleInternal))
	(local $i            i32)
	(local $item         (ref $Value))

	(local.set $src-internal (struct.get $Tuple $internal (local.get $src)))

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $src-internal))))
			(local.set $item (array.get $TupleInternal (local.get $src-internal) (local.get $i)))
			(call $Dict.set (local.get $dest) (call $Property.from-tuple
				(struct.get $Tuple $internal (ref.cast (ref $Tuple) (struct.get $Value $composite (local.get $item))))
			))
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
)
(func $Dict.fill-from-list (export "Dict#fillFromList") (param $dest (ref $Dict)) (param $src (ref $List))
	(local $src-internal (ref $ListInternal))
	(local $i            i32)
	(local $item         (ref null $Value))

	(local.set $src-internal (struct.get $List $internal (local.get $src)))

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $src-internal))))
			(local.set $item (array.get $ListInternal (local.get $src-internal) (local.get $i)))
			(if
				(i32.eqz (ref.is_null (local.get $item)))
				(then (call $Dict.set (local.get $dest) (call $Property.from-tuple
					(struct.get $Tuple $internal (ref.cast (ref $Tuple) (struct.get $Value $composite (local.get $item))))
				)))
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
)
(func $Dict.fill-from-set (export "Dict#fillFromSet") (param $dest (ref $Dict)) (param $src (ref $Map))
	(local $src-internal (ref $MapInternal))
	(local $i            i32)
	(local $item         (ref null $Case))

	(local.set $src-internal (struct.get $Map  $internal (local.get $src)))

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $src-internal))))
			(local.set $item (array.get $MapInternal (local.get $src-internal) (local.get $i)))
			(if
				(i32.eqz (ref.is_null (local.get $item)))
				(then (call $Dict.set (local.get $dest) (call $Property.from-tuple
					(struct.get $Tuple $internal (ref.cast (ref $Tuple) (struct.get $Value $composite (struct.get $Case $ant (local.get $item)))))
				)))
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
)
(func $Dict.fill-from-map (export "Dict#fillFromMap") (param $dest (ref $Dict)) (param $src (ref $Map))
	(local $src-internal (ref $MapInternal))
	(local $i            i32)
	(local $item         (ref null $Case))

	(local.set $src-internal (struct.get $Map  $internal (local.get $src)))

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $src-internal))))
			(local.set $item (array.get $MapInternal (local.get $src-internal) (local.get $i)))
			(if
				(i32.eqz (ref.is_null (local.get $item)))
				(then (call $Dict.set (local.get $dest) (call $Property.from-case (ref.as_non_null (local.get $item)))))
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
)
