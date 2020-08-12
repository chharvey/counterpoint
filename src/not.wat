;; # Logical Negation Operator for Integers
(func $inot (param $p0 i32) (result i32)
	(if (result i32) (i32.eqz (local.get $p0))
		(then (i32.const 1))
	(else
		(i32.const 0)
	))
)
