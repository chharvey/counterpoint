;; stringify a v128: for `$Value.$primitive`.
(func $stringify-v128 (param $v v128) (result (ref $String))
	(unreachable) ;; TODO:
)



;; stringify a $Tuple.
(func $stringify-Tuple (param $tuple (ref $Tuple)) (result (ref $String))
	(unreachable) ;; TODO:
)



;; stringify a $Record.
(func $stringify-Record (param $record (ref $Record)) (result (ref $String))
	(unreachable) ;; TODO:
)



;; stringify an $Object.
(func $stringify-Object (param $object (ref $Object)) (result (ref $String))
	(unreachable) ;; TODO:
)



;; ## Main Stringify Function ##
(func $stringify (param $value (ref $Value)) (result (ref $String))
	(local $tag       i32)
	(local $composite eqref)

	(local.set $tag       (struct.get $Value $tag       (local.get $value)))
	(local.set $composite (struct.get $Value $composite (local.get $value)))

	(if
		(i32.eq (local.get $tag) (i32.const 1))
		(then (return (call $stringify-v128 (struct.get $Value $primitive (local.get $value)))))
	)
	(if
		(i32.eq (local.get $tag) (i32.const 2))
		(then
			(if (ref.test (ref $String) (local.get $composite)) (then (return (ref.cast (ref $String) (local.get $composite)))))
			(if (ref.test (ref $Tuple)  (local.get $composite)) (then (return (call $stringify-Tuple  (ref.cast (ref $Tuple)  (local.get $composite))))))
			(if (ref.test (ref $Record) (local.get $composite)) (then (return (call $stringify-Record (ref.cast (ref $Record) (local.get $composite))))))
			(if (ref.test (ref $Object) (local.get $composite)) (then (return (call $stringify-Object (ref.cast (ref $Object) (local.get $composite))))))
		)
	)
	(unreachable)
)
