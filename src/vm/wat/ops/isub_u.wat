;; # Subtraction Operator for Naturals
(func $isub_u (param $p0 i64) (param $p1 i64) (result i64)
	(if (result i64) (i64.lt_u (local.get $p0) (local.get $p1))
		(then (i64.const 0))
		(else (i64.sub (local.get $p0) (local.get $p1)))
	)
)
