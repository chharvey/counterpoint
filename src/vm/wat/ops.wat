(func $cpl:is-null (param $value (ref $Value)) (result (ref $Value))
	(call $Value.bool-from-i32 (i32.and
		(call $Value.is-primitive (local.get $value))
		(call $Vect.is-null (struct.get $Value $primitive (local.get $value)))
	))
)



(func $cpl:not (param $value (ref $Value)) (result (ref $Value))
	(call $Value.bool-from-i32 (i32.and
		(call $Value.is-primitive (local.get $value))
		(i32.or
			(call $Vect.is-null  (struct.get $Value $primitive (local.get $value)))
			(call $Vect.is-false (struct.get $Value $primitive (local.get $value)))
		)
	))
)




(func $cpl:is-empty (param $value (ref $Value)) (result (ref $Value))
	(local $primitive v128)
	(local.set $primitive (struct.get $Value $primitive (local.get $value)))

	(if (result (ref $Value))
		(call $Value.is-primitive (local.get $value))
		(then (if (result (ref $Value))
			(call $Vect.is-special (local.get $primitive))
			(then (call $cpl:not (local.get $value)))
			(else (call $Value.bool-from-i32 (call $is-empty/number (local.get $primitive))))
		))
		(else (call $Value.bool-from-i32 (call $is-empty/composite (ref.as_non_null (struct.get $Value $composite (local.get $value))))))
	)
)
(func $is-empty/number (param $primitive v128) (result i32)
	(if (call $Vect.is-int   (local.get $primitive)) (then (return (i64.eqz (call $Vect.as-int (local.get $primitive))))))
	(if (call $Vect.is-nat   (local.get $primitive)) (then (return (i64.eqz (call $Vect.as-nat (local.get $primitive))))))
	(if (call $Vect.is-float (local.get $primitive)) (then (return (f64.eq (call $Vect.as-float (local.get $primitive)) (f64.const 0.0))))) ;; also takes care of -0.0
	(unreachable)
)
(func $is-empty/composite (param $composite (ref eq)) (result i32)
	(if (ref.test (ref $Tuple)  (local.get $composite)) (then (return (i32.eqz (array.len              (ref.cast (ref $Tuple)  (local.get $composite)))))))
	(if (ref.test (ref $Record) (local.get $composite)) (then (return (i32.eqz (array.len              (ref.cast (ref $Record) (local.get $composite)))))))
	(if (ref.test (ref $List)   (local.get $composite)) (then (return (i32.eqz (struct.get $List $size (ref.cast (ref $List)   (local.get $composite)))))))
	(if (ref.test (ref $Dict)   (local.get $composite)) (then (return (i32.eqz (struct.get $Dict $size (ref.cast (ref $Dict)   (local.get $composite)))))))
	(if (ref.test (ref $Map)    (local.get $composite)) (then (return (i32.eqz (struct.get $Map  $size (ref.cast (ref $Map)    (local.get $composite)))))))
	(unreachable)
)



(func $cpl:negate (param $value (ref $Value)) (result (ref $Value))
	(local $primitive v128)
	(local.set $primitive (struct.get $Value $primitive (local.get $value)))

	(struct.new $Value
		(i32.const 1)
		(if (result v128)
			(call $Vect.is-int (local.get $primitive))
			;; `-n` in two’s complement is `(n xor -1) + 1`
			(then (call $Vect.new-int (i64.add
				(i64.xor (call $Vect.as-int (local.get $primitive)) (i64.const -1))
				(i64.const 1)
			)))
			(else (if (result v128)
				(call $Vect.is-float (local.get $primitive))
				(then (call $Vect.new-float (f64.neg (call $Vect.as-float (local.get $primitive)))))
				(else (unreachable))
			))
		)
		(ref.null eq)
	)
)
