;; # Empty Operator for Integers
(func $iemp (param $p0 i32) (result i32)
	(if (result i32) (i32.eqz (local.get $p0))
		(then (i32.const 1))
	(else
		(i32.const 0)
	))
)



;; # Empty Operator for Floats
(func $femp (param $p0 f64) (result i32)
	(if (result i32) (f64.eq (local.get $p0) (f64.const 0.0)) ;; also takes care of -0.0
		(then (i32.const 1))
	(else
		(i32.const 0)
	))
)
