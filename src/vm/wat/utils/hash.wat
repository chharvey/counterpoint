(global $PRIME i64 (i64.const 0x00000100000001b3)) ;; 64-bit FNV_prime
(global $SEED  i64 (i64.const 0x48617368416c676f)) ;; "HashAlgo" in UTF-8
;;                              H a s h A l g o



;; ## Main Hash Function ##
(func $Value.hash (param $value (ref $Value)) (result i64)
	(local $composite eqref)

	(local.set $composite (struct.get $Value $composite (local.get $value)))

	(if
		(call $Value.is-primitive (local.get $value))
		(then (return_call $!v128.hash (struct.get $Value $primitive (local.get $value))))
	)
	(if
		(call $Value.is-composite (local.get $value))
		(then
			(if (ref.test (ref $String) (local.get $composite)) (then (return_call $!String.hash (ref.cast (ref $String) (local.get $composite)))))
			(if (ref.test (ref $Tuple)  (local.get $composite)) (then (return_call $!Tuple.hash  (ref.cast (ref $Tuple)  (local.get $composite)))))
			(if (ref.test (ref $Record) (local.get $composite)) (then (return_call $!Record.hash (ref.cast (ref $Record) (local.get $composite)))))
			(if (ref.test (ref $Object) (local.get $composite)) (then (return_call $!Object.hash (ref.cast (ref $Object) (local.get $composite)))))
		)
	)
	(unreachable)
)



;; hash a v128: for `$Value.$primitive`.
;; ```
;; [SEED, lane_0, lane_1].reduce((a, b) => (a xor b) * PRIME);
;; ```
(func $!v128.hash (param $v v128) (result i64)
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
(func $!Property.hash (param $prop (ref $Property)) (result i64)
	(i64.mul
		(i64.xor
			(i64.mul
				(i64.xor
					(global.get $SEED)
					(struct.get $Property $key (local.get $prop))
				)
				(global.get $PRIME)
			)
			(call $Value.hash (struct.get $Property $val (local.get $prop)))
		)
		(global.get $PRIME)
	)
)



;; hash a $String.
;; ```
;; [SEED, ...$string.codeunits].reduce((a, b) => (a xor i64.extend_i32_u(b)) * PRIME);
;; ```
(func $!String.hash (param $string (ref $String)) (result i64)
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
(func $!Tuple.hash (param $tuple (ref $Tuple)) (result i64)
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
					(call $Value.hash (array.get $Tuple (local.get $tuple) (local.get $i)))
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
;; Similar to `$!Tuple.hash` except that we don’t multiply by PRIME until the very end.
;; Doing so preserves commutativity, which is necessary for Records,
;; because keys may be inserted in any order.
;; ```
;; [SEED, ...$record.entries()].reduce((a, b) => a xor hash(b)) * PRIME;
;; ```
(func $!Record.hash (param $record (ref $Record)) (result i64)
	(local $result i64)
	(local $i      i32)

	(local.set $result (global.get $SEED))

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $record))))
			(local.set $result (i64.xor
				(local.get $result)
				(call $!Property.hash (array.get $Record (local.get $record) (local.get $i)))
			))
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
	(i64.mul (local.get $result) (global.get $PRIME))
)



;; hash an $Object.
;; Applies to all Objects, including Lists, Dicts, and Maps.
;; Returns its id.
(func $!Object.hash (param $obj (ref $Object)) (result i64)
	(struct.get $Object $id (local.get $obj))
)
