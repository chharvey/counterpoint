;; Returns the new capacity of an array for reallocation.
;; The number of items in (“size of”) an array must not be less than 43.75% (7/16) of its length,
;; and must not reach 87.5% (7/8) or more of its length.
;; ```
;; assert: for all arrays `a`, `a.length * 7 / 16 <= a.size < a.length * 7 / 8`.
;; ```
;; When allocating a new array, this function is used to determine the new capacity.
;; If the size of the array is too small, a capacity of half the array’s current length is returned;
;; if the size is too large, a capacity of double its length is returned;
;; otherwise the array’s current length is returned.
;; @param $size the number of items in an array (the array may be sparse, containing null values, and it need not be front-packed)
;; @param $len  the length of the array
;; @return      either half of `$len`, twice `$len`, or `$len`, depending on `$size`
(func $capacity (param $size i32) (param $len i32) (result i32)
	(if (result i32) (i32.ge_u
		(local.get $size)
		;; `$len * 7 / 8` will always be a whole number since `$len` is always a multiple of 8.
		(i32.div_u (i32.mul (local.get $len) (i32.const 7)) (i32.const 8)) ;; MAX_LOAD_FACTOR == 7.0/8.0 == 0.875
	)
		(then (i32.mul (local.get $len) (i32.const 2)))
		(else (if (result i32) (i32.and
			(i32.gt_u (local.get $len) (i32.const 8))
			(i32.lt_u
				(local.get $size)
				;; `$len * 7 / 16` will always be a whole number since `$len` is a multiple of 16 when it’s greater than 8.
				(i32.div_u (i32.mul (local.get $len) (i32.const 7)) (i32.const 16)) ;; MIN_LOAD_FACTOR == 7.0/16.0 == 0.4375
			)
		)
			(then (i32.div_u (local.get $len) (i32.const 2)))
			(else (local.get $len))
		))
	)
)
