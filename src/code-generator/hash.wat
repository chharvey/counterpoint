(global $PRIME i64 (i64.const 0x00000100000001b3)) ;; 64-bit FNV_prime
(global $SEED  i64 (i64.const 0x48617368416c676f)) ;; "HashAlgo" in UTF-8
;;                              H a s h A l g o



;; hash a v128: for `$Value.$primitive`.
;; ```
;; [SEED, lane_0, lane_1].reduce((a, b) => (a xor b) * PRIME);
;; ```
(func $hash-v128 (param $v v128) (result i64)
	(i64.mul
		(i64.xor
			(i64.mul
				(i64.xor
					(global.get $SEED)
					(i64x2.extract_lane 0 (local.get $v))
				)
				(global.get $PRIME)
			)
			(i64x2.extract_lane 1 (local.get $v))
		)
		(global.get $PRIME)
	)
)



;; hash a $Property.
;; ```
;; [SEED, $prop.$key, hash($prop.$val)].reduce((a, b) => (a xor b) * PRIME);
;; ```
(func $hash-Property (param $prop (ref $Property)) (result i64)
	(i64.mul
		(i64.xor
			(i64.mul
				(i64.xor
					(global.get $SEED)
					(struct.get $Property $key (local.get $prop))
				)
				(global.get $PRIME)
			)
			(call $hash (struct.get $Property $val (local.get $prop)))
		)
		(global.get $PRIME)
	)
)



;; hash a $String.
;; ```
;; [SEED, ...$string.codeunits].reduce((a, b) => (a xor i64.extend_u(b)) * PRIME);
;; ```
(func $hash-String (param $string (ref $String)) (result i64)
	(local $result i64)
	(local $i      i32)

	(local.set $result (global.get $SEED))

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $string))))
			(local.set $result (i64.mul
				(i64.xor
					(local.get $result)
					(i64.extend_i32_u (array.get_u $String (local.get $string) (local.get $i)))
				)
				(global.get $PRIME)
			))
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
	(local.get $result)
)



;; hash a $Tuple.
;; ```
;; [SEED, ...$tuple.values()].reduce((a, b) => (a xor hash(b)) * PRIME);
;; ```
(func $hash-Tuple (param $tuple (ref $Tuple)) (result i64)
	(local $result i64)
	(local $i      i32)

	(local.set $result (global.get $SEED))

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $tuple))))
			(local.set $result (i64.mul
				(i64.xor
					(local.get $result)
					(call $hash (array.get $Tuple (local.get $tuple) (local.get $i)))
				)
				(global.get $PRIME)
			))
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
	(local.get $result)
)



;; hash a $Record.
;; Similar to `$hash-Tuple` except that we don’t multiply by PRIME until the very end.
;; Doing so preserves commutativity, which is necessary for Records,
;; because keys may be inserted in any order.
;; ```
;; [SEED, ...$record.entries()].reduce((a, b) => a xor hash(b)) * PRIME;
;; ```
(func $hash-Record (param $record (ref $Record)) (result i64)
	(local $result i64)
	(local $i      i32)

	(local.set $result (global.get $SEED))

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $record))))
			(local.set $result (i64.xor
				(local.get $result)
				(call $hash-Property (array.get $Record (local.get $record) (local.get $i)))
			))
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
	(i64.mul (local.get $result) (global.get $PRIME))
)



;; hash an $Object.
;; Returns its id.
(func $hash-Object (param $obj (ref $Object)) (result i64)
	(struct.get $Object $id (local.get $obj))
)



;; ## Main Hash Function ##
(func $hash (param $value (ref $Value)) (result i64)
	(local $tag       i32)
	(local $composite eqref)

	(local.set $tag       (struct.get $Value $tag       (local.get $value)))
	(local.set $composite (struct.get $Value $composite (local.get $value)))

	(if
		(i32.eq (local.get $tag) (i32.const 1))
		(then (return (call $hash-v128 (struct.get $Value $primitive (local.get $value)))))
	)
	(if
		(i32.eq (local.get $tag) (i32.const 2))
		(then
			(if (ref.test (ref $String) (local.get $composite)) (then (return (call $hash-String (ref.cast (ref $String) (local.get $composite))))))
			(if (ref.test (ref $Tuple)  (local.get $composite)) (then (return (call $hash-Tuple  (ref.cast (ref $Tuple)  (local.get $composite))))))
			(if (ref.test (ref $Record) (local.get $composite)) (then (return (call $hash-Record (ref.cast (ref $Record) (local.get $composite))))))
			(if (ref.test (ref $Object) (local.get $composite)) (then (return (call $hash-Object (ref.cast (ref $Object) (local.get $composite))))))
		)
	)
	(unreachable)
)
