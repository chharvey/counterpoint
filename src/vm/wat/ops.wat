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
			(else (call $Value.bool-from-i32 (if (result i32)
				(call $Vect.is-int (local.get $primitive))
				(then (i64.eqz (call $Vect.as-int (local.get $primitive))))
				(else (if (result i32)
					(call $Vect.is-nat (local.get $primitive))
					(then (i64.eqz (call $Vect.as-nat (local.get $primitive))))
					(else (if (result i32)
						(call $Vect.is-float (local.get $primitive))
						(then (f64.eq (call $Vect.as-float (local.get $primitive)) (f64.const 0.0))) ;; also takes care of -0.0
						(else (unreachable)) ;; exhausted all cases
					))
				))
			)))
		))
		(else (call $Value.bool-from-i32 (call $cemp (ref.as_non_null (struct.get $Value $composite (local.get $value))))))
	)
)
