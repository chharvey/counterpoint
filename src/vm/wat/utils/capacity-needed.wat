;; Returns the minimum capacity needed for an array of a given number of elements.
;;
;; All arrays must have minimum length of 8, and all arrays must have a length that is some power of 2.
;; The number of non-null elements in (or “size of”) an array must not exceed 87.5% (7/8) of its length.
;; It is also recommended that the size of an array be greater than 43.75% (7/16) of its length
;; (though this recommendation is not always observed).
;; ```
;; assertion:      for all arrays `a`, `a.len >= 8`.
;; assertion:      for all arrays `a`, `a.len == 2 ^ k` for some `k` in `N+`.
;; assertion:      for all arrays `a`, `|a| <= a.len * 7 / 8`.
;; recommendation: for all arrays `a`, `|a| > a.len * 7 / 16`.
;; ```
;; The following table illustrates this relationship.
;;
;; | Size      | Capacity | Percentage Filled
;; | --------- | -------- | -----------------
;; |   0 –   7 |        8 | 0%    – 87.5%
;; |   8 –  14 |       16 | 50%   – 87.5%
;; |  15 –  28 |       32 | 46.9% – 87.5%
;; |  29 –  56 |       64 | 45.3% – 87.5%
;; |  57 – 112 |      128 | 44.5% – 87.5%
;; | 113 – 224 |      256 | 44.1% – 87.5%
;; | 225 – 448 |      512 | 43.9% – 87.5%
;; | 449 – 896 |     1024 | 43.8% – 87.5%
;;
;; Note that this function returns the *minimum* capacity needed for its size;
;; it is still possible (but not recommended) for an array to have a larger capacity than the minimum required.
;; This policy ensures that all arrays have at least some empty slots,
;; while also utilizing space efficiently for arrays with few elements.
(func $util:capacity-needed (param $size i32) (result i32)
	;; temporary constant for performance.
	(local $s8 i32)
	;; the returned result.
	(local $capacity i32)

	(local.set $s8       (i32.mul (local.get $size) (i32.const 8)))
	(local.set $capacity (i32.const 8))

	(block $exit
		(loop $repeat
			;; keep doubling `$capacity` until `$size <= $capacity * 7 / 8`
			(br_if $exit (i32.le_u (local.get $s8) (i32.mul (local.get $capacity) (i32.const 7))))
			(local.set $capacity (i32.mul (local.get $capacity) (i32.const 2)))
			(br $repeat)
		)
	)
	(local.get $capacity)
)
