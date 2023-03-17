(func $sign (param $p0 f64) (result i32)
	(i32.trunc_f64_s (f64.copysign (f64.const 1.0) (local.get $p0)))
)

;; # Identity Operator for Floats
(func $fid (param $p0 f64) (param $p1 f64) (result i32)
	(i32.and
		(f64.eq (local.get $p0) (local.get $p1))
		(i32.eq
			(call $sign (local.get $p0))
			(call $sign (local.get $p1))
		)
	)
)

;; # Identity Operator for Integer/Float
;; Returns false, as an Integer is never identical to a Float.
;; This function is still needed so that runtime evaluation of arguments is still performed.
(func $i_f_id (param $p0 i32) (param $p1 f64) (result i32)
	(i32.const 0)
)

;; # Identity Operator for Float/Integer
;; Returns false, as a Float is never identical to an Integer.
;; This function is still needed so that runtime evaluation of arguments is still performed.
(func $f_i_id (param $p0 f64) (param $p1 i32) (result i32)
	(i32.const 0)
)
