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



(func $cpl:int-add (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-int (i64.add
		(call $Vect.as-int (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-int (struct.get $Value $primitive (local.get 1)))
	)))
)
(func $cpl:nat-add (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-nat (i64.add
		(call $Vect.as-nat (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-nat (struct.get $Value $primitive (local.get 1)))
	)))
)
(func $cpl:float-add (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-float (f64.add
		(call $Vect.as-float (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-float (struct.get $Value $primitive (local.get 1)))
	)))
)



(func $cpl:int-sub (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-int (i64.sub
		(call $Vect.as-int (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-int (struct.get $Value $primitive (local.get 1)))
	)))
)
(func $cpl:nat-sub (param (ref $Value) (ref $Value)) (result (ref $Value))
	(local $nat0 i64)
	(local $nat1 i64)
	(local.set $nat0 (call $Vect.as-nat (struct.get $Value $primitive (local.get 0))))
	(local.set $nat1 (call $Vect.as-nat (struct.get $Value $primitive (local.get 1))))

	(call $Value.new-primitive (call $Vect.new-nat (if (result i64)
		(i64.lt_u (local.get $nat0) (local.get $nat1))
		(then (i64.const 0))
		(else (i64.sub (local.get $nat0) (local.get $nat1)))
	)))
)
(func $cpl:float-sub (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-float (f64.sub
		(call $Vect.as-float (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-float (struct.get $Value $primitive (local.get 1)))
	)))
)



(func $cpl:int-mul (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-int (i64.mul
		(call $Vect.as-int (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-int (struct.get $Value $primitive (local.get 1)))
	)))
)
(func $cpl:nat-mul (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-nat (i64.mul
		(call $Vect.as-nat (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-nat (struct.get $Value $primitive (local.get 1)))
	)))
)
(func $cpl:float-mul (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-float (f64.mul
		(call $Vect.as-float (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-float (struct.get $Value $primitive (local.get 1)))
	)))
)



(func $cpl:int-div (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-int (i64.div_s
		(call $Vect.as-int (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-int (struct.get $Value $primitive (local.get 1)))
	)))
)
(func $cpl:nat-div (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-nat (i64.div_u
		(call $Vect.as-nat (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-nat (struct.get $Value $primitive (local.get 1)))
	)))
)
(func $cpl:float-div (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-float (f64.div
		(call $Vect.as-float (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-float (struct.get $Value $primitive (local.get 1)))
	)))
)



(func $cpl:int-exp (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-int (call $i64.exp
		(call $Vect.as-int (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-int (struct.get $Value $primitive (local.get 1)))
	)))
)
(func $cpl:nat-exp (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-nat (call $i64.exp
		(call $Vect.as-nat (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-nat (struct.get $Value $primitive (local.get 1)))
	)))
)
(func $cpl:float-exp (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-float (unreachable
		(call $Vect.as-float (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-float (struct.get $Value $primitive (local.get 1)))
	)))
)
;; # Exponent Operator for Integers
;; ```
;; x ^ y
;; 	:=     (x^2) ^ (y / 2)       if y is even
;; 	:= x * (x^2) ^ ((y - 1) / 2) if y is odd
;; ```
;; ```
;; function exp(base, exponent) {
;; 	return (
;; 		(exponent <   0) ? 0 :
;; 		(exponent === 0) ? 1 :
;; 		(exponent === 1) ? base :
;; 		(exponent === 2) ? base * base :
;; 		(base === 0) ? 0 :
;; 		(base === 1) ? 1 :
;; 		(base === 2 && exponent < 64) ? 1 << exponent : // `1 << x` (when `x` is less than bit width) is a more performant way to do `2 ** x`
;; 		(exponent % 2 === 0)
;; 			// `x >> 1` is a more performant way to do `x / 2`
;; 			?        exp(base * base,  exponent      >> 1)
;; 			: base * exp(base * base, (exponent - 1) >> 1)
;; 	)
;; }
;; ```
(func $i64.exp (param $base i64) (param $exponent i64) (result i64)
	(if
		(i64.lt_s (local.get $exponent) (i64.const 0))
		(then (return (i64.const 0)))
	)
	(if
		(i64.eqz (local.get $exponent))
		(then (return (i64.const 1)))
	)
	(if
		(i64.eq (local.get $exponent) (i64.const 1))
		(then (return (local.get $base)))
	)
	(if
		(i64.eq (local.get $exponent) (i64.const 2))
		(then (return (i64.mul (local.get $base) (local.get $base))))
	)
	(if
		(i64.eqz (local.get $base))
		(then (return (i64.const 0)))
	)
	(if
		(i64.eq (local.get $base) (i64.const 1))
		(then (return (i64.const 1)))
	)
	(if
		(i32.and (i64.eq (local.get $base) (i64.const 2)) (i64.lt_s (local.get $exponent) (i64.const 64)))
		(then (return (i64.shl (i64.const 1) (local.get $exponent))))
	)
	(if (result i64)
		(i64.gt_u (i64.ctz (local.get $exponent)) (i64.const 0)) ;; $exponent % 2 === 0
		(then (call $i64.exp
			(i64.mul (local.get $base) (local.get $base))
			(i64.shr_s (local.get $exponent) (i64.const 1))
		))
		(else (i64.mul
			(local.get $base)
			(call $i64.exp
				(i64.mul (local.get $base) (local.get $base))
				(i64.shr_s (i64.sub (local.get $exponent) (i64.const 1)) (i64.const 1))
			)
		))
	)
)
