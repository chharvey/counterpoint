;; ## Main Stringify Function ##
(func $Value.stringify (param $value (ref $Value)) (result (ref $String))
	(local $tag       i32)
	(local $composite eqref)

	(local.set $tag       (struct.get $Value $tag       (local.get $value)))
	(local.set $composite (struct.get $Value $composite (local.get $value)))

	(if
		(i32.eq (local.get $tag) (i32.const 1))
		(then (return_call $!v128.stringify (struct.get $Value $primitive (local.get $value))))
	)
	(if
		(i32.eq (local.get $tag) (i32.const 2))
		(then
			(if (ref.test (ref $String) (local.get $composite)) (then (return (ref.cast (ref $String) (local.get $composite)))))
			(if (ref.test (ref $Tuple)  (local.get $composite)) (then (return_call $!Tuple.stringify  (ref.cast (ref $Tuple)  (local.get $composite)))))
			(if (ref.test (ref $Record) (local.get $composite)) (then (return_call $!Record.stringify (ref.cast (ref $Record) (local.get $composite)))))
			(if (ref.test (ref $Object) (local.get $composite)) (then (return_call $!Object.stringify (ref.cast (ref $Object) (local.get $composite)))))
		)
	)
	(unreachable)
)



;; stringify a v128: for `$Value.$primitive`.
(func $!v128.stringify (param $v v128) (result (ref $String))
	(unreachable) ;; TODO:
)



;; stringify a $Tuple.
(func $!Tuple.stringify (param $tuple (ref $Tuple)) (result (ref $String))
	(unreachable) ;; TODO:
)



;; stringify a $Record.
(func $!Record.stringify (param $record (ref $Record)) (result (ref $String))
	(unreachable) ;; TODO:
)



;; stringify an $Object.
(func $!Object.stringify (param $object (ref $Object)) (result (ref $String))
	(unreachable) ;; TODO:
)
