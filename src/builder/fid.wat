;; # Identity Operator for Floats
(func $fid (param $p0 f64) (param $p1 f64) (result i32)
	(i64.eq
		(i64.reinterpret_f64 (local.get $p0))
		(i64.reinterpret_f64 (local.get $p1))
	)
)
