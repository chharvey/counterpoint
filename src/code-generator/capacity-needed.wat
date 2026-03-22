;; Returns the capacity needed for an array of a given number of elements.
;; The number of items in (“size of”) an array must not be less than 43.75% (7/16) of its length,
;; and must not reach 87.5% (7/8) or more of its length.
;; All arrays must have minimum length of 8.
;; ```
;; assert: for all arrays `a`, `a.len * 7 / 16 <= a.size < a.len * 7 / 8`.
;; assert: for all arrays `a`, `a.len >= 8`.
;; ```
;; When allocating a new array, this function is used to determine the new capacity.
;; If the size of the array is too small, a capacity of half the array’s current length is returned;
;; if the size is too large, a capacity of double its length is returned;
;; otherwise the array’s current length is returned.
;; @param $size the number of items in an array (the array may be sparse, containing null values, and it need not be front-packed)
;; @param $len  the length of the array
;; @return      either half of `$len`, twice `$len`, or `$len`, depending on `$size`
(func $capacity-needed (param $size i32) (result i32)
	(local $result i32)
	(local $limit  i32)

	(local.set $result (i32.const 8))
	(local.set $limit  (i32.div_u (i32.mul (local.get $size) (i32.const 8)) (i32.const 7)))

	(block $exit
		(loop $repeat
			(br_if $exit (i32.gt_u (local.get $result) (local.get $limit)))
			(local.set $result (i32.mul (local.get $result) (i32.const 2)))
			(br $repeat)
		)
	)
	(local.get $result)
)
