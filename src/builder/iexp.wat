;; # Exponent Operator for Integers
;; ```
;; x ^ y
;; 	:=     (x^2) ^ (y / 2)       if y is even
;; 	:= x * (x^2) ^ ((y - 1) / 2) if y is odd
;; ```
;; ```
;; function iexp(base, exponent) {
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
;; 			?        iexp(base * base,  exponent      >> 1)
;; 			: base * iexp(base * base, (exponent - 1) >> 1)
;; 	)
;; }
;; ```
(func $iexp (param $p0 i64) (param $p1 i64) (result i64)
	(if (result i64) (i64.lt_s (local.get $p1) (i64.const 0)) ;; if $p1 < 0
		(then (i64.const 0)) ;; return 0
	(else (if (result i64) (i64.eqz (local.get $p1)) ;; else if $p1 === 0
		(then (i64.const 1)) ;; return 1
	(else (if (result i64) (i64.eq (local.get $p1) (i64.const 1)) ;; else if $p1 === 1
		(then (local.get $p0)) ;; return $p0
	(else (if (result i64) (i64.eq (local.get $p1) (i64.const 2)) ;; else if $p1 === 2
		(then (i64.mul (local.get $p0) (local.get $p0))) ;; return $p0 * $p0
	(else (if (result i64) (i64.eqz (local.get $p0)) ;; else if $p0 === 0
		(then (i64.const 0)) ;; return 0
	(else (if (result i64) (i64.eq (local.get $p0) (i64.const 1)) ;; else if $p0 === 1
		(then (i64.const 1)) ;; return 1
	(else (if (result i64) (i32.and (i64.eq (local.get $p0) (i64.const 2)) (i64.lt_s (local.get $p1) (i64.const 64))) ;; else if $p0 === 2 && $p1 < 64
		(then (i64.shl (i64.const 1) (local.get $p1))) ;; return 1 << $p1
	(else (if (result i64) (i64.gt_u (i64.ctz (local.get $p1)) (i64.const 0)) ;; else if $p1 % 2 === 0
		(then (call $iexp ;; return $iexp($p0 * $p0, $p1 / 2)
			(i64.mul (local.get $p0) (local.get $p0))
			(i64.shr_s (local.get $p1) (i64.const 1))
		))
	(else ;; else (assert $p1 % 2 === 1)
		(i64.mul ;; return $p0 * $iexp($p0 * $p0, ($p1 - 1) / 2)
			(local.get $p0)
			(call $iexp
				(i64.mul (local.get $p0) (local.get $p0))
				(i64.shr_s (i64.sub (local.get $p1) (i64.const 1)) (i64.const 1))
			)
		)
	)) )) )) )) )) )) )) ))
)
