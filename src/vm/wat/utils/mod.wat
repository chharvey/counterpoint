;; # Modulo Operator for Integers
;; ```
;; x mod y := ((x % y) + y) % y, where `%` is signed remainder
;; ```
;; `y` should always be positive.
;; When `x` is negative, x mod y is always positive: `-7 mod 3 == 2`
(func $util:mod (param $p0 i32) (param $p1 i32) (result i32)
	(i32.rem_s
		(i32.add
			(i32.rem_s (local.get $p0) (local.get $p1))
			(local.get $p1)
		)
		(local.get $p1)
	)
)
