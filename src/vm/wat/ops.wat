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

	(call $Value.new-primitive (if (result v128)
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
	))
)



(func $cpl:to-int (param $value (ref $Value)) (result (ref $Value))
	(local $primitive v128)
	(local.set $primitive (struct.get $Value $primitive (local.get $value)))

	(call $Value.new-primitive (if (result v128)
		(call $Vect.is-int (local.get $primitive))
		(then (local.get $primitive))
		(else (if (result v128)
			(call $Vect.is-nat (local.get $primitive))
			(then (call $Vect.new-int (call $Vect.nat-to-int (local.get $primitive))))
			(else (if (result v128)
				(call $Vect.is-float (local.get $primitive))
				(then (call $Vect.new-int (call $Vect.float-to-int (local.get $primitive))))
				(else (unreachable))
			))
		))
	))
)
(func $cpl:to-nat (param $value (ref $Value)) (result (ref $Value))
	(local $primitive v128)
	(local.set $primitive (struct.get $Value $primitive (local.get $value)))

	(call $Value.new-primitive (if (result v128)
		(call $Vect.is-int (local.get $primitive))
		(then (call $Vect.new-nat (call $Vect.int-to-nat (local.get $primitive))))
		(else (if (result v128)
			(call $Vect.is-nat (local.get $primitive))
			(then (local.get $primitive))
			(else (if (result v128)
				(call $Vect.is-float (local.get $primitive))
				(then (call $Vect.new-nat (call $Vect.float-to-nat (local.get $primitive))))
				(else (unreachable))
			))
		))
	))
)
(func $cpl:to-float (param $value (ref $Value)) (result (ref $Value))
	(local $primitive v128)
	(local.set $primitive (struct.get $Value $primitive (local.get $value)))

	(call $Value.new-primitive (if (result v128)
		(call $Vect.is-int (local.get $primitive))
		(then (call $Vect.new-float (call $Vect.int-to-float (local.get $primitive))))
		(else (if (result v128)
			(call $Vect.is-nat (local.get $primitive))
			(then (call $Vect.new-float (call $Vect.nat-to-float (local.get $primitive))))
			(else (if (result v128)
				(call $Vect.is-float (local.get $primitive))
				(then (local.get $primitive))
				(else (unreachable))
			))
		))
	))
)



(func $cpl:int-add (param $arg0 (ref $Value)) (param $arg1 (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-int (i64.add
		(call $Vect.as-int (struct.get $Value $primitive (local.get $arg0)))
		(call $Vect.as-int (struct.get $Value $primitive (local.get $arg1)))
	)))
)
(func $cpl:nat-add (param $arg0 (ref $Value)) (param $arg1 (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-nat (i64.add
		(call $Vect.as-nat (struct.get $Value $primitive (local.get $arg0)))
		(call $Vect.as-nat (struct.get $Value $primitive (local.get $arg1)))
	)))
)
(func $cpl:float-add (param $arg0 (ref $Value)) (param $arg1 (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-float (f64.add
		(call $Vect.as-float (struct.get $Value $primitive (local.get $arg0)))
		(call $Vect.as-float (struct.get $Value $primitive (local.get $arg1)))
	)))
)



(func $cpl:int-sub (param $arg0 (ref $Value)) (param $arg1 (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-int (i64.sub
		(call $Vect.as-int (struct.get $Value $primitive (local.get $arg0)))
		(call $Vect.as-int (struct.get $Value $primitive (local.get $arg1)))
	)))
)
(func $cpl:nat-sub (param $arg0 (ref $Value)) (param $arg1 (ref $Value)) (result (ref $Value))
	(local $nat0 i64)
	(local $nat1 i64)
	(local.set $nat0 (call $Vect.as-nat (struct.get $Value $primitive (local.get $arg0))))
	(local.set $nat1 (call $Vect.as-nat (struct.get $Value $primitive (local.get $arg1))))

	(call $Value.new-primitive (call $Vect.new-nat (if (result i64)
		(i64.lt_u (local.get $nat0) (local.get $nat1))
		(then (i64.const 0))
		(else (i64.sub (local.get $nat0) (local.get $nat1)))
	)))
)
(func $cpl:float-sub (param $arg0 (ref $Value)) (param $arg1 (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-float (f64.sub
		(call $Vect.as-float (struct.get $Value $primitive (local.get $arg0)))
		(call $Vect.as-float (struct.get $Value $primitive (local.get $arg1)))
	)))
)



(func $cpl:int-mul (param $arg0 (ref $Value)) (param $arg1 (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-int (i64.mul
		(call $Vect.as-int (struct.get $Value $primitive (local.get $arg0)))
		(call $Vect.as-int (struct.get $Value $primitive (local.get $arg1)))
	)))
)
(func $cpl:nat-mul (param $arg0 (ref $Value)) (param $arg1 (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-nat (i64.mul
		(call $Vect.as-nat (struct.get $Value $primitive (local.get $arg0)))
		(call $Vect.as-nat (struct.get $Value $primitive (local.get $arg1)))
	)))
)
(func $cpl:float-mul (param $arg0 (ref $Value)) (param $arg1 (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-float (f64.mul
		(call $Vect.as-float (struct.get $Value $primitive (local.get $arg0)))
		(call $Vect.as-float (struct.get $Value $primitive (local.get $arg1)))
	)))
)



(func $cpl:int-div (param $arg0 (ref $Value)) (param $arg1 (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-int (i64.div_s
		(call $Vect.as-int (struct.get $Value $primitive (local.get $arg0)))
		(call $Vect.as-int (struct.get $Value $primitive (local.get $arg1)))
	)))
)
(func $cpl:nat-div (param $arg0 (ref $Value)) (param $arg1 (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-nat (i64.div_u
		(call $Vect.as-nat (struct.get $Value $primitive (local.get $arg0)))
		(call $Vect.as-nat (struct.get $Value $primitive (local.get $arg1)))
	)))
)
(func $cpl:float-div (param $arg0 (ref $Value)) (param $arg1 (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-float (f64.div
		(call $Vect.as-float (struct.get $Value $primitive (local.get $arg0)))
		(call $Vect.as-float (struct.get $Value $primitive (local.get $arg1)))
	)))
)



(func $cpl:int-exp (param $arg0 (ref $Value)) (param $arg1 (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-int (call $iexp
		(call $Vect.as-int (struct.get $Value $primitive (local.get $arg0)))
		(call $Vect.as-int (struct.get $Value $primitive (local.get $arg1)))
	)))
)
(func $cpl:nat-exp (param $arg0 (ref $Value)) (param $arg1 (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-nat (call $iexp
		(call $Vect.as-nat (struct.get $Value $primitive (local.get $arg0)))
		(call $Vect.as-nat (struct.get $Value $primitive (local.get $arg1)))
	)))
)
(func $cpl:float-exp (param $arg0 (ref $Value)) (param $arg1 (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-float (unreachable
		(call $Vect.as-float (struct.get $Value $primitive (local.get $arg0)))
		(call $Vect.as-float (struct.get $Value $primitive (local.get $arg1)))
	)))
)
