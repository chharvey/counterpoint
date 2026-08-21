(func $op:to-int (export "op::toInt") (param $value (ref $Value)) (result (ref $Value))
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
(func $op:to-nat (export "op::toNat") (param $value (ref $Value)) (result (ref $Value))
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
(func $op:to-float (export "op::toFloat") (param $value (ref $Value)) (result (ref $Value))
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



(func $op:not (export "op::not") (param $value (ref $Value)) (result (ref $Value))
	(call $Value.bool-from-i32 (i32.or
		(i32.and
			(call $Value.is-primitive (local.get $value))
			(i32.or
				(call $Vect.is-null  (struct.get $Value $primitive (local.get $value)))
				(call $Vect.is-false (struct.get $Value $primitive (local.get $value)))
			)
		)
		(call $Value.bool-to-i32 (call $op:is-none (local.get $value)))
	))
)



(func $op:is-empty (export "op::isEmpty") (param $value (ref $Value)) (result (ref $Value))
	(local $primitive v128)
	(local.set $primitive (struct.get $Value $primitive (local.get $value)))

	(if (result (ref $Value))
		(call $Value.is-primitive (local.get $value))
		(then (if (result (ref $Value))
			(call $Vect.is-special (local.get $primitive))
			(then (call $op:not (local.get $value)))
			(else (call $Value.bool-from-i32 (call $!op:is-empty/number (local.get $primitive))))
		))
		(else (call $Value.bool-from-i32 (call $!op:is-empty/composite (ref.as_non_null (struct.get $Value $composite (local.get $value))))))
	)
)
(func $!op:is-empty/number (param $primitive v128) (result i32)
	(if (call $Vect.is-int   (local.get $primitive)) (then (return (i64.eqz (call $Vect.as-int (local.get $primitive))))))
	(if (call $Vect.is-nat   (local.get $primitive)) (then (return (i64.eqz (call $Vect.as-nat (local.get $primitive))))))
	(if (call $Vect.is-float (local.get $primitive)) (then (return (f64.eq (call $Vect.as-float (local.get $primitive)) (f64.const 0.0))))) ;; also takes care of -0.0
	(unreachable)
)
(func $!op:is-empty/composite (param $composite (ref eq)) (result i32)
	(if (ref.test (ref $Tuple)  (local.get $composite)) (then (return (i32.eqz (array.len              (ref.cast (ref $Tuple)  (local.get $composite)))))))
	(if (ref.test (ref $Record) (local.get $composite)) (then (return (i32.eqz (array.len              (ref.cast (ref $Record) (local.get $composite)))))))
	(if (ref.test (ref $List)   (local.get $composite)) (then (return (i32.eqz (struct.get $List $size (ref.cast (ref $List)   (local.get $composite)))))))
	(if (ref.test (ref $Dict)   (local.get $composite)) (then (return (i32.eqz (struct.get $Dict $size (ref.cast (ref $Dict)   (local.get $composite)))))))
	(if (ref.test (ref $Map)    (local.get $composite)) (then (return (i32.eqz (struct.get $Map  $size (ref.cast (ref $Map)    (local.get $composite)))))))
	(unreachable)
)



(func $op:negate (export "op::negate") (param $value (ref $Value)) (result (ref $Value))
	(local $primitive v128)
	(local.set $primitive (struct.get $Value $primitive (local.get $value)))

	(call $Value.new-primitive (if (result v128)
		(call $Vect.is-int (local.get $primitive))
		(then (call $Vect.new-int (i64.sub (i64.const 0) (call $Vect.as-int (local.get $primitive))))) ;; `-n == 0 - n`
		(else (if (result v128)
			(call $Vect.is-float (local.get $primitive))
			(then (call $Vect.new-float (f64.neg (call $Vect.as-float (local.get $primitive)))))
			(else (unreachable))
		))
	))
)



(func $op:unwrap-maybe (export "op::unwrapMaybe") (param $value (ref $Value)) (result (ref $Value))
	(local $mval (ref null $Value))
	(local.set $mval (struct.get $Maybe $value (ref.cast (ref $Maybe) (struct.get $Value $composite (local.get $value)))))
	(if (result (ref $Value))
		(ref.is_null (local.get $mval))
		(then (unreachable))
		(else (ref.as_non_null (local.get $mval)))
	)
)



(func $op:is-int (param $value (ref $Value)) (result (ref $Value))
	(call $Value.bool-from-i32 (i32.and
		(call $Value.is-primitive (local.get $value))
		(call $Vect.is-int (struct.get $Value $primitive (local.get $value)))
	))
)
(func $op:is-nat (param $value (ref $Value)) (result (ref $Value))
	(call $Value.bool-from-i32 (i32.and
		(call $Value.is-primitive (local.get $value))
		(call $Vect.is-nat (struct.get $Value $primitive (local.get $value)))
	))
)
(func $op:is-float (param $value (ref $Value)) (result (ref $Value))
	(call $Value.bool-from-i32 (i32.and
		(call $Value.is-primitive (local.get $value))
		(call $Vect.is-float (struct.get $Value $primitive (local.get $value)))
	))
)
(func $op:is-string (param $value (ref $Value)) (result (ref $Value))
	(call $Value.bool-from-i32 (i32.and
		(call $Value.is-composite (local.get $value))
		(ref.test (ref $String) (struct.get $Value $composite (local.get $value)))
	))
)
(func $op:is-object (param $value (ref $Value)) (result (ref $Value))
	(call $Value.bool-from-i32 (i32.and
		(call $Value.is-composite (local.get $value))
		(ref.test (ref $Object) (struct.get $Value $composite (local.get $value)))
	))
)
(func $op:is-list (param $value (ref $Value)) (result (ref $Value))
	(call $Value.bool-from-i32 (i32.and
		(call $Value.is-composite (local.get $value))
		(ref.test (ref $List) (struct.get $Value $composite (local.get $value)))
	))
)
(func $op:is-dict (param $value (ref $Value)) (result (ref $Value))
	(call $Value.bool-from-i32 (i32.and
		(call $Value.is-composite (local.get $value))
		(ref.test (ref $Dict) (struct.get $Value $composite (local.get $value)))
	))
)
(func $op:is-map (param $value (ref $Value)) (result (ref $Value))
	(call $Value.bool-from-i32 (i32.and
		(call $Value.is-composite (local.get $value))
		(ref.test (ref $Map) (struct.get $Value $composite (local.get $value)))
	))
)
(func $op:is-maybe (param $value (ref $Value)) (result (ref $Value))
	(call $Value.bool-from-i32 (i32.and
		(call $Value.is-composite (local.get $value))
		(ref.test (ref $Maybe) (struct.get $Value $composite (local.get $value)))
	))
)
(func $op:is-none (export "op::isNone") (param $value (ref $Value)) (result (ref $Value))
	(local $composite (ref null eq))
	(local.set $composite (struct.get $Value $composite (local.get $value)))
	(call $Value.bool-from-i32 (i32.and
		(call $Value.is-composite (local.get $value))
		(if (result i32) ;; `(i32.and)` doesn’t short-circuit, so using conditional
			(ref.test (ref $Maybe) (local.get $composite))
			(then (ref.is_null (struct.get $Maybe $value (ref.cast (ref $Maybe) (local.get $composite)))))
			(else (i32.const 0))
		)
	))
)
(func $op:is-some (export "op::isSome") (param $value (ref $Value)) (result (ref $Value))
	(local $composite (ref null eq))
	(local.set $composite (struct.get $Value $composite (local.get $value)))
	(call $Value.bool-from-i32 (i32.and
		(call $Value.is-composite (local.get $value))
		(if (result i32) ;; `(i32.and)` doesn’t short-circuit, so using conditional
			(ref.test (ref $Maybe) (local.get $composite))
			(then (i32.eqz (ref.is_null (struct.get $Maybe $value (ref.cast (ref $Maybe) (local.get $composite))))))
			(else (i32.const 0))
		)
	))
)



(func $op:as-null (export "op::asNull") (param $value (ref $Value)) (result (ref $Value))
	(if
		(i32.and
			(call $Value.is-primitive (local.get $value))
			(call $Vect.is-null (struct.get $Value $primitive (local.get $value)))
		)
		(then (return (local.get $value)))
		(else (unreachable))
	)
)
(func $op:as-bool (export "op::asBool") (param $value (ref $Value)) (result (ref $Value))
	(if
		(i32.and
			(call $Value.is-primitive (local.get $value))
			(i32.or
				(call $Vect.is-false (struct.get $Value $primitive (local.get $value)))
				(call $Vect.is-true  (struct.get $Value $primitive (local.get $value)))
			)
		)
		(then (return (local.get $value)))
		(else (unreachable))
	)
)
(func $op:as-int (export "op::asInt") (param $value (ref $Value)) (result (ref $Value))
	(if
		(call $Value.bool-to-i32 (call $op:is-int (local.get $value)))
		(then (return (local.get $value)))
		(else (unreachable))
	)
)
(func $op:as-nat (export "op::asNat") (param $value (ref $Value)) (result (ref $Value))
	(if
		(call $Value.bool-to-i32 (call $op:is-nat (local.get $value)))
		(then (return (local.get $value)))
		(else (unreachable))
	)
)
(func $op:as-float (export "op::asFloat") (param $value (ref $Value)) (result (ref $Value))
	(if
		(call $Value.bool-to-i32 (call $op:is-float (local.get $value)))
		(then (return (local.get $value)))
		(else (unreachable))
	)
)
(func $op:as-string (export "op::asString") (param $value (ref $Value)) (result (ref $Value))
	(return_call $Value.new-composite (ref.cast (ref $String) (struct.get $Value $composite (local.get $value))))
)
(func $op:as-object (export "op::asObject") (param $value (ref $Value)) (result (ref $Value))
	(return_call $Value.new-composite (ref.cast (ref $Object) (struct.get $Value $composite (local.get $value))))
)
(func $op:as-list (export "op::asList") (param $value (ref $Value)) (result (ref $Value))
	(return_call $Value.new-composite (ref.cast (ref $List) (struct.get $Value $composite (local.get $value))))
)
(func $op:as-dict (export "op::asDict") (param $value (ref $Value)) (result (ref $Value))
	(return_call $Value.new-composite (ref.cast (ref $Dict) (struct.get $Value $composite (local.get $value))))
)
(func $op:as-map (export "op::asMap") (param $value (ref $Value)) (result (ref $Value))
	(return_call $Value.new-composite (ref.cast (ref $Map) (struct.get $Value $composite (local.get $value))))
)
(func $op:as-maybe (export "op::asMaybe") (param $value (ref $Value)) (result (ref $Value))
	(return_call $Value.new-composite (ref.cast (ref $Maybe) (struct.get $Value $composite (local.get $value))))
)
(func $op:as-none (export "op::asNone") (param $value (ref $Value)) (result (ref $Value))
	(local $maybe (ref $Maybe))
	(local.set $maybe (ref.cast (ref $Maybe) (struct.get $Value $composite (local.get $value))))
	(if
		(i32.eqz (ref.is_null (struct.get $Maybe $value (local.get $maybe))))
		(then (unreachable))
		(else (return_call $Value.new-composite (local.get $maybe)))
	)
)
(func $op:as-some (export "op::asSome") (param $value (ref $Value)) (result (ref $Value))
	(local $maybe (ref $Maybe))
	(local.set $maybe (ref.cast (ref $Maybe) (struct.get $Value $composite (local.get $value))))
	(if
		(ref.is_null (struct.get $Maybe $value (local.get $maybe)))
		(then (unreachable))
		(else (return_call $Value.new-composite (local.get $maybe)))
	)
)



(func $op:int-add (export "op::intAdd") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-int (i64.add
		(call $Vect.as-int (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-int (struct.get $Value $primitive (local.get 1)))
	)))
)
(func $op:nat-add (export "op::natAdd") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-nat (i64.add
		(call $Vect.as-nat (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-nat (struct.get $Value $primitive (local.get 1)))
	)))
)
(func $op:float-add (export "op::floatAdd") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-float (f64.add
		(call $Vect.as-float (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-float (struct.get $Value $primitive (local.get 1)))
	)))
)



(func $op:int-sub (export "op::intSub") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-int (i64.sub
		(call $Vect.as-int (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-int (struct.get $Value $primitive (local.get 1)))
	)))
)
(func $op:nat-sub (export "op::natSub") (param (ref $Value) (ref $Value)) (result (ref $Value))
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
(func $op:float-sub (export "op::floatSub") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-float (f64.sub
		(call $Vect.as-float (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-float (struct.get $Value $primitive (local.get 1)))
	)))
)



(func $op:int-mul (export "op::intMul") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-int (i64.mul
		(call $Vect.as-int (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-int (struct.get $Value $primitive (local.get 1)))
	)))
)
(func $op:nat-mul (export "op::natMul") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-nat (i64.mul
		(call $Vect.as-nat (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-nat (struct.get $Value $primitive (local.get 1)))
	)))
)
(func $op:float-mul (export "op::floatMul") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-float (f64.mul
		(call $Vect.as-float (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-float (struct.get $Value $primitive (local.get 1)))
	)))
)



(func $op:int-div (export "op::intDiv") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-int (i64.div_s
		(call $Vect.as-int (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-int (struct.get $Value $primitive (local.get 1)))
	)))
)
(func $op:nat-div (export "op::natDiv") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-nat (i64.div_u
		(call $Vect.as-nat (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-nat (struct.get $Value $primitive (local.get 1)))
	)))
)
(func $op:float-div (export "op::floatDiv") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-float (f64.div
		(call $Vect.as-float (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-float (struct.get $Value $primitive (local.get 1)))
	)))
)



(func $op:int-exp (export "op::intExp") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-int (call $!i64.exp
		(call $Vect.as-int (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-int (struct.get $Value $primitive (local.get 1)))
	)))
)
(func $op:nat-exp (export "op::natExp") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.new-primitive (call $Vect.new-nat (call $!i64.exp
		(call $Vect.as-nat (struct.get $Value $primitive (local.get 0)))
		(call $Vect.as-nat (struct.get $Value $primitive (local.get 1)))
	)))
)
(func $op:float-exp (export "op::floatExp") (param (ref $Value) (ref $Value)) (result (ref $Value))
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
(func $!i64.exp (param $base i64) (param $exponent i64) (result i64)
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
		(then (call $!i64.exp
			(i64.mul (local.get $base) (local.get $base))
			(i64.shr_s (local.get $exponent) (i64.const 1))
		))
		(else (i64.mul
			(local.get $base)
			(call $!i64.exp
				(i64.mul (local.get $base) (local.get $base))
				(i64.shr_s (i64.sub (local.get $exponent) (i64.const 1)) (i64.const 1))
			)
		))
	)
)



(func $op:lt (export "op::lt") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.bool-from-i32 (call $util:compare-numbers
		(struct.get $Value $primitive (local.get 0))
		(struct.get $Value $primitive (local.get 1))
		(ref.func $!i64.lt_s)
		(ref.func $!i64.lt_u)
		(ref.func $!f64.lt)
	))
)

(func $op:gt (export "op::gt") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.bool-from-i32 (call $util:compare-numbers
		(struct.get $Value $primitive (local.get 0))
		(struct.get $Value $primitive (local.get 1))
		(ref.func $!i64.gt_s)
		(ref.func $!i64.gt_u)
		(ref.func $!f64.gt)
	))
)

(func $op:le (export "op::le") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.bool-from-i32 (call $util:compare-numbers
		(struct.get $Value $primitive (local.get 0))
		(struct.get $Value $primitive (local.get 1))
		(ref.func $!i64.le_s)
		(ref.func $!i64.le_u)
		(ref.func $!f64.le)
	))
)

(func $op:ge (export "op::ge") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(call $Value.bool-from-i32 (call $util:compare-numbers
		(struct.get $Value $primitive (local.get 0))
		(struct.get $Value $primitive (local.get 1))
		(ref.func $!i64.ge_s)
		(ref.func $!i64.ge_u)
		(ref.func $!f64.ge)
	))
)



(func $op:id (export "op::id") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(local $vect0 v128)
	(local $vect1 v128)
	(local $ref0 (ref null eq))
	(local $ref1 (ref null eq))
	(local.set $vect0 (struct.get $Value $primitive (local.get 0)))
	(local.set $vect1 (struct.get $Value $primitive (local.get 1)))
	(local.set $ref0  (struct.get $Value $composite (local.get 0)))
	(local.set $ref1  (struct.get $Value $composite (local.get 1)))

	(call $Value.bool-from-i32 (block $exit (result i32)
		(if
			(i32.and
				(call $Value.is-primitive (local.get 0))
				(call $Value.is-primitive (local.get 1))
			)
			(then
				(if
					(i32.and
						(call $Vect.is-special (local.get $vect0))
						(call $Vect.is-special (local.get $vect1))
					)
					(then (br $exit (i32.eq
						(call $Vect.type (local.get $vect0))
						(call $Vect.type (local.get $vect1))
					)))
				)
				(if
					(i32.and
						(call $Vect.is-int (local.get $vect0))
						(call $Vect.is-int (local.get $vect1))
					)
					(then (br $exit (i64.eq
						(call $Vect.as-int (local.get $vect0))
						(call $Vect.as-int (local.get $vect1))
					)))
				)
				(if
					(i32.and
						(call $Vect.is-nat (local.get $vect0))
						(call $Vect.is-nat (local.get $vect1))
					)
					(then (br $exit (i64.eq
						(call $Vect.as-nat (local.get $vect0))
						(call $Vect.as-nat (local.get $vect1))
					)))
				)
				(if
					(i32.and
						(call $Vect.is-float (local.get $vect0))
						(call $Vect.is-float (local.get $vect1))
					)
					;; identity of floats compares bitwise
					(then (br $exit (i64.eq
						(i64.reinterpret_f64 (call $Vect.as-float (local.get $vect0)))
						(i64.reinterpret_f64 (call $Vect.as-float (local.get $vect1)))
					)))
				)
				(br $exit (i32.const 0))
			)
		)
		(if
			(ref.eq
				(local.get $ref0)
				(local.get $ref1)
			)
			(then (br $exit (i32.const 1)))
		)
		(if
			(i32.and
				(ref.test (ref $String) (local.get $ref0))
				(ref.test (ref $String) (local.get $ref1))
			)
			(then (br $exit (call $!String.identical
				(ref.cast (ref $String) (local.get $ref0))
				(ref.cast (ref $String) (local.get $ref1))
			)))
		)
		(if
			(i32.and
				(ref.test (ref $Tuple) (local.get $ref0))
				(ref.test (ref $Tuple) (local.get $ref1))
			)
			(then (br $exit (call $!Tuple.identical
				(ref.cast (ref $Tuple) (local.get $ref0))
				(ref.cast (ref $Tuple) (local.get $ref1))
			)))
		)
		(if
			(i32.and
				(ref.test (ref $Record) (local.get $ref0))
				(ref.test (ref $Record) (local.get $ref1))
			)
			(then (br $exit (call $!Record.identical
				(ref.cast (ref $Record) (local.get $ref0))
				(ref.cast (ref $Record) (local.get $ref1))
			)))
		)
		(i32.const 0)
	))
)
;; Returns whether two strings are identical by value —
;; whether they contain the exact same sequence of code units.
(func $!String.identical (param $string0 (ref $String)) (param $string1 (ref $String)) (result i32)
	(local $i i32)

	(if
		(i32.ne (array.len (local.get $string0)) (array.len (local.get $string1)))
		(then (return (i32.const 0)))
	)

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $string0))))
			(if
				(i32.ne
					(array.get $String (local.get $string0) (local.get $i))
					(array.get $String (local.get $string1) (local.get $i))
				)
				(then (return (i32.const 0)))
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
	(i32.const 1)
)
;; Returns whether two tuples are identical by value —
;; whether they have identical items at the same indices.
(func $!Tuple.identical (param $tuple0 (ref $Tuple)) (param $tuple1 (ref $Tuple)) (result i32)
	(local $i i32)

	(if
		(i32.ne (array.len (local.get $tuple0)) (array.len (local.get $tuple1)))
		(then (return (i32.const 0)))
	)

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $tuple0))))
			(if
				(i32.eqz (call $Value.bool-to-i32 (call $op:id
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
;; Returns whether two records are identical by value —
;; whether they have identical values at the same keys.
(func $!Record.identical (param $record0 (ref $Record)) (param $record1 (ref $Record)) (result i32)
	(local $i    i32)
	(local $prop (ref $Property))
	(local $key  i64)

	(if
		(i32.ne (array.len (local.get $record0)) (array.len (local.get $record1)))
		(then (return (i32.const 0)))
	)

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $record0))))
			(local.set $prop (array.get $Record (local.get $record0) (local.get $i)))
			(local.set $key  (struct.get $Property $key (local.get $prop)))
			(if
				(i32.eqz (call $Record.has-key (local.get $record1) (local.get $key)))
				(then (return (i32.const 0)))
			)
			(if
				(i32.eqz (call $Value.bool-to-i32 (call $op:id
					(struct.get $Property $val (local.get $prop))
					(call $Record.get (local.get $record1) (local.get $key))
				)))
				(then (return (i32.const 0)))
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
	(i32.const 1)
)



(func $op:eq (export "op::eq") (param (ref $Value) (ref $Value)) (result (ref $Value))
	(local $vect0 v128)
	(local $vect1 v128)
	(local $ref0 (ref null eq))
	(local $ref1 (ref null eq))

	;; identical values are necessarily equal
	(if
		(call $Value.bool-to-i32 (call $op:id (local.get 0) (local.get 1)))
		(then (return_call $Value.new-primitive (global.get $Vect.TRUE)))
	)

	(local.set $vect0 (struct.get $Value $primitive (local.get 0)))
	(local.set $vect1 (struct.get $Value $primitive (local.get 1)))
	(local.set $ref0  (struct.get $Value $composite (local.get 0)))
	(local.set $ref1  (struct.get $Value $composite (local.get 1)))

	(call $Value.bool-from-i32 (block $exit (result i32)
		(if
			(i32.and
				(call $Value.is-primitive (local.get 0))
				(call $Value.is-primitive (local.get 0))
			)
			(then (br $exit (if (result i32)
				(i32.or
					(call $Vect.is-special (local.get $vect0))
					(call $Vect.is-special (local.get $vect1))
				)
				(then (i32.const 0))
				(else (call $util:compare-numbers
					(struct.get $Value $primitive (local.get 0))
					(struct.get $Value $primitive (local.get 1))
					(ref.func $!i64.eq)
					(ref.func $!i64.eq)
					(ref.func $!f64.eq)
				))
			)))
		)
		(if
			(i32.and
				(ref.test (ref $String) (local.get $ref0))
				(ref.test (ref $String) (local.get $ref1))
			)
			(then (br $exit (call $!String.equal
				(ref.cast (ref $String) (local.get $ref0))
				(ref.cast (ref $String) (local.get $ref1))
			)))
		)
		(if
			(i32.and
				(ref.test (ref $Tuple) (local.get $ref0))
				(ref.test (ref $Tuple) (local.get $ref1))
			)
			(then (br $exit (call $!Tuple.equal
				(ref.cast (ref $Tuple) (local.get $ref0))
				(ref.cast (ref $Tuple) (local.get $ref1))
			)))
		)
		(if
			(i32.and
				(ref.test (ref $Record) (local.get $ref0))
				(ref.test (ref $Record) (local.get $ref1))
			)
			(then (br $exit (call $!Record.equal
				(ref.cast (ref $Record) (local.get $ref0))
				(ref.cast (ref $Record) (local.get $ref1))
			)))
		)
		(if
			(i32.and
				(ref.test (ref $List) (local.get $ref0))
				(ref.test (ref $List) (local.get $ref1))
			)
			(then (br $exit (call $!List.equal
				(ref.cast (ref $List) (local.get $ref0))
				(ref.cast (ref $List) (local.get $ref1))
			)))
		)
		(if
			(i32.and
				(ref.test (ref $Dict) (local.get $ref0))
				(ref.test (ref $Dict) (local.get $ref1))
			)
			(then (br $exit (call $!Dict.equal
				(ref.cast (ref $Dict) (local.get $ref0))
				(ref.cast (ref $Dict) (local.get $ref1))
			)))
		)
		(if
			(i32.and
				(ref.test (ref $Map) (local.get $ref0))
				(ref.test (ref $Map) (local.get $ref1))
			)
			(then (br $exit (call $!Map.equal
				(ref.cast (ref $Map) (local.get $ref0))
				(ref.cast (ref $Map) (local.get $ref1))
			)))
		)
		(if
			(i32.and
				(ref.test (ref $Maybe) (local.get $ref0))
				(ref.test (ref $Maybe) (local.get $ref1))
			)
			(then (br $exit (call $!Maybe.equal
				(ref.cast (ref $Maybe) (local.get $ref0))
				(ref.cast (ref $Maybe) (local.get $ref1))
			)))
		)
		(i32.const 0)
	))
)
;; Returns whether two strings are equal —
;; strings are equal if and only if they are identical.
(func $!String.equal (param (ref $String) (ref $String)) (result i32)
	(call $!String.identical (local.get 0) (local.get 1))
)
;; Returns whether two tuples are equal —
;; whether they have equal items at the same indices.
(func $!Tuple.equal (param $tuple0 (ref $Tuple)) (param $tuple1 (ref $Tuple)) (result i32)
	(local $i i32)

	(if
		(i32.ne (array.len (local.get $tuple0)) (array.len (local.get $tuple1)))
		(then (return (i32.const 0)))
	)

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $tuple0))))
			(if
				(i32.eqz (call $Value.bool-to-i32 (call $op:eq
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
;; Returns whether two records are equal —
;; whether they have equal values at the same keys.
(func $!Record.equal (param $record0 (ref $Record)) (param $record1 (ref $Record)) (result i32)
	(local $i    i32)
	(local $prop (ref $Property))
	(local $key  i64)

	(if
		(i32.ne (array.len (local.get $record0)) (array.len (local.get $record1)))
		(then (return (i32.const 0)))
	)

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $record0))))
			(local.set $prop (array.get $Record (local.get $record0) (local.get $i)))
			(local.set $key  (struct.get $Property $key (local.get $prop)))
			(if
				(i32.eqz (call $Record.has-key (local.get $record1) (local.get $key)))
				(then (return (i32.const 0)))
			)
			(if
				(i32.eqz (call $Value.bool-to-i32 (call $op:eq
					(struct.get $Property $val (local.get $prop))
					(call $Record.get (local.get $record1) (local.get $key))
				)))
				(then (return (i32.const 0)))
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
	(i32.const 1)
)
;; Returns whether two Lists are equal —
;; whether they have equal items at the same indices.
(func $!List.equal (param $list0 (ref $List)) (param $list1 (ref $List)) (result i32)
	(local $i         i32)
	(local $internal0 (ref $ListInternal))
	(local $internal1 (ref $ListInternal))
	(local $item0     (ref null $Value))
	(local $item1     (ref null $Value))

	;; Lists that are identical are always equal
	(if
		(ref.eq (local.get $list0) (local.get $list1))
		(then (return (i32.const 1)))
	)

	;; compare $List.$size since two equal Lists may have different internal array lengths
	(if
		(i32.ne (struct.get $List $size (local.get $list0)) (struct.get $List $size (local.get $list1)))
		(then (return (i32.const 0)))
	)

	(local.set $internal0 (struct.get $List $internal (local.get $list0)))
	(local.set $internal1 (struct.get $List $internal (local.get $list1)))

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $internal0))))
			(local.set $item0 (array.get $ListInternal (local.get $internal0) (local.get $i)))
			(local.set $item1 (array.get $ListInternal (local.get $internal1) (local.get $i)))

			;; if they’re both null, we’ve reached the end of all live items; the Lists are equal; return true
			(if
				(i32.and
					(ref.is_null (local.get $item0))
					(ref.is_null (local.get $item1))
				)
				(then (return (i32.const 1)))
			)

			;; if exactly one of them is null, or neither of them is null and they’re not equal, return false
			(if
				(i32.or
					(i32.or
						(i32.and
							(ref.is_null (local.get $item0))
							(i32.eqz (ref.is_null (local.get $item1)))
						)
						(i32.and
							(i32.eqz (ref.is_null (local.get $item0)))
							(ref.is_null (local.get $item1))
						)
					)
					(i32.and
						(i32.and
							(i32.eqz (ref.is_null (local.get $item0)))
							(i32.eqz (ref.is_null (local.get $item1)))
						)
						(i32.eqz (call $Value.bool-to-i32 (call $op:eq
							(ref.cast (ref $Value) (local.get $item0))
							(ref.cast (ref $Value) (local.get $item1))
						)))
					)
				)
				(then (return (i32.const 0)))
			)

			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
	(i32.const 1)
)
;; Returns whether two Dicts are equal —
;; whether they have equal values at the same keys.
(func $!Dict.equal (param $dict0 (ref $Dict)) (param $dict1 (ref $Dict)) (result i32)
	(local $i         i32)
	(local $internal0 (ref $DictInternal))
	(local $internal1 (ref $DictInternal))
	(local $prop0     (ref null $Property))
	(local $prop1     (ref null $Property))
	(local $key       i64)

	;; Dicts that are identical are always equal
	(if
		(ref.eq (local.get $dict0) (local.get $dict1))
		(then (return (i32.const 1)))
	)

	;; compare $Dict.$size since two equal Dicts may have different internal array lengths
	(if
		(i32.ne (struct.get $Dict $size (local.get $dict0)) (struct.get $Dict $size (local.get $dict1)))
		(then (return (i32.const 0)))
	)

	(local.set $internal0 (struct.get $Dict $internal (local.get $dict0)))
	(local.set $internal1 (struct.get $Dict $internal (local.get $dict1)))

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $internal0))))
			(local.set $prop0 (array.get $DictInternal (local.get $internal0) (local.get $i)))
			(if
				(i32.eqz (ref.is_null (local.get $prop0)))
				(then
					(local.set $key (struct.get $Property $key (local.get $prop0)))

					;; if $dict1 doesn’t have the key, return false
					(drop (local.set $prop1 (call $Dict.find (local.get $dict1) (local.get $key))))
					(if
						(i32.or
							(ref.is_null (local.get $prop1))
							(call $Property.is-tombstone (local.get $prop1))
						)
						(then (return (i32.const 0)))
					)

					(if
						(i32.eqz (call $Value.bool-to-i32 (call $op:eq
							(struct.get $Property $val (local.get $prop0))
							(struct.get $Property $val (local.get $prop1))
						)))
						(then (return (i32.const 0)))
					)
				)
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
	(i32.const 1)
)
;; Returns whether two Maps are equal —
;; whether they have equal consequents at equal antecedents.
(func $!Map.equal (param $map0 (ref $Map)) (param $map1 (ref $Map)) (result i32)
	(local $i         i32)
	(local $internal0 (ref $MapInternal))
	(local $internal1 (ref $MapInternal))
	(local $case0     (ref null $Case))
	(local $case1     (ref null $Case))
	(local $ant       (ref $Value))

	;; Maps that are identical are always equal
	(if
		(ref.eq (local.get $map0) (local.get $map1))
		(then (return (i32.const 1)))
	)

	;; compare $Map.$size since two equal Maps may have different internal array lengths
	(if
		(i32.ne (struct.get $Map $size (local.get $map0)) (struct.get $Map $size (local.get $map1)))
		(then (return (i32.const 0)))
	)

	(local.set $internal0 (struct.get $Map $internal (local.get $map0)))
	(local.set $internal1 (struct.get $Map $internal (local.get $map1)))

	(block $exit
		(local.set $i (i32.const 0))
		(loop $repeat
			(br_if $exit (i32.ge_u (local.get $i) (array.len (local.get $internal0))))
			(local.set $case0 (array.get $MapInternal (local.get $internal0) (local.get $i)))
			(if
				(i32.eqz (ref.is_null (local.get $case0)))
				(then
					(local.set $ant (struct.get $Case $ant (local.get $case0)))

					;; if $map1 doesn’t have the key, return false
					(drop (local.set $case1 (call $Map.find (local.get $map1) (local.get $ant))))
					(if
						(i32.or
							(ref.is_null (local.get $case1))
							(call $Case.is-tombstone (local.get $case1))
						)
						(then (return (i32.const 0)))
					)

					(if
						(i32.eqz (call $Value.bool-to-i32 (call $op:eq
							(struct.get $Case $con (local.get $case0))
							(struct.get $Case $con (local.get $case1))
						)))
						(then (return (i32.const 0)))
					)
				)
			)
			(local.set $i (i32.add (local.get $i) (i32.const 1)))
			(br $repeat)
		)
	)
	(i32.const 1)
)
;; Returns whether two Maybes are equal —
;; whether they are both None, or are both Some with equal values.
(func $!Maybe.equal (param $maybe0 (ref $Maybe)) (param $maybe1 (ref $Maybe)) (result i32)
	(local $value0 (ref null $Value))
	(local $value1 (ref null $Value))

	;; Maybes that are identical are always equal
	(if
		(ref.eq (local.get $maybe0) (local.get $maybe1))
		(then (return (i32.const 1)))
	)

	(local.set $value0 (struct.get $Maybe $value (local.get $maybe0)))
	(local.set $value1 (struct.get $Maybe $value (local.get $maybe1)))

	;; if both are None, return true; else if any is None, return false; else continue
	(if
		(i32.and
			(ref.is_null (local.get $value0))
			(ref.is_null (local.get $value1))
		)
		(then (return (i32.const 1)))
		(else (if
			(i32.or
				(ref.is_null (local.get $value0))
				(ref.is_null (local.get $value1))
			)
			(then (return (i32.const 0)))
		))
	)

	;; return whether values are equal
	(call $Value.bool-to-i32 (call $op:eq
		(ref.as_non_null (local.get $value0))
		(ref.as_non_null (local.get $value1))
	))
)



;; wraps opcodes so they can be referenced dynamically
(func $!i64.eq   (type $i64.relop) (i64.eq   (local.get 0) (local.get 1)))
(func $!i64.lt_s (type $i64.relop) (i64.lt_s (local.get 0) (local.get 1)))
(func $!i64.lt_u (type $i64.relop) (i64.lt_u (local.get 0) (local.get 1)))
(func $!i64.gt_s (type $i64.relop) (i64.gt_s (local.get 0) (local.get 1)))
(func $!i64.gt_u (type $i64.relop) (i64.gt_u (local.get 0) (local.get 1)))
(func $!i64.le_s (type $i64.relop) (i64.le_s (local.get 0) (local.get 1)))
(func $!i64.le_u (type $i64.relop) (i64.le_u (local.get 0) (local.get 1)))
(func $!i64.ge_s (type $i64.relop) (i64.ge_s (local.get 0) (local.get 1)))
(func $!i64.ge_u (type $i64.relop) (i64.ge_u (local.get 0) (local.get 1)))
(func $!f64.eq   (type $f64.relop) (f64.eq   (local.get 0) (local.get 1)))
(func $!f64.lt   (type $f64.relop) (f64.lt   (local.get 0) (local.get 1)))
(func $!f64.gt   (type $f64.relop) (f64.gt   (local.get 0) (local.get 1)))
(func $!f64.le   (type $f64.relop) (f64.le   (local.get 0) (local.get 1)))
(func $!f64.ge   (type $f64.relop) (f64.ge   (local.get 0) (local.get 1)))
