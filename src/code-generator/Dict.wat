;; Find a Property in a Dict with the given key.
;; If a Property with the key is found, returns the property and its matching index.
;; Else, returns a null Property with the index that the key hashes to.
;;
;; Useful for get and set operations:
;; - when getting:
;; 	- if a null Property is returned, no entry with the given key exists in the Dict
;; 	- if a non-null Property is returned, its value is what you want
;; - when setting:
;; 	- if a null Property is returned, put the new entry at the returned index
;; 	- if a non-null Property is returned, replace it in the Dict with the new entry
(func $Dict.find (param $dict (ref $Dict)) (param $key i32) (result i32 (ref null $Property))
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
		(if (i32.or
			(ref.is_null (local.get $prop))
			(i32.eq (struct.get $Property $key (local.get $prop)) (local.get $key))
		)
			(then (return (local.get $index) (local.get $prop)))
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
