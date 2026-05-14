;; ## Main Stringify Function ##
(func $Value.stringify (param $value (ref $Value)) (result (ref $String))
	(local $tag       i32)
	(local $primitive v128)
	(local $composite eqref)

	(local.set $tag       (struct.get $Value $tag       (local.get $value)))
	(local.set $primitive (struct.get $Value $primitive (local.get $value)))
	(local.set $composite (struct.get $Value $composite (local.get $value)))

	(if
		(i32.eq (local.get $tag) (i32.const 1))
		(then
			(if (call $Vect.is-null (local.get $primitive)) (then (return (array.new_fixed $String 4
				(i32.const 0x6e) ;; 'n'
				(i32.const 0x75) ;; 'u'
				(i32.const 0x6c) ;; 'l'
				(i32.const 0x6c) ;; 'l'
			))))
			(if (call $Vect.is-false (local.get $primitive)) (then (return (array.new_fixed $String 5
				(i32.const 0x66) ;; 'f'
				(i32.const 0x61) ;; 'a'
				(i32.const 0x6c) ;; 'l'
				(i32.const 0x73) ;; 's'
				(i32.const 0x65) ;; 'e'
			))))
			(if (call $Vect.is-true (local.get $primitive)) (then (return (array.new_fixed $String 4
				(i32.const 0x74) ;; 't'
				(i32.const 0x72) ;; 'r'
				(i32.const 0x75) ;; 'u'
				(i32.const 0x65) ;; 'e'
			))))
			(if (call $Vect.is-int   (local.get $primitive)) (then (return_call $!i64.stringify_s (call $Vect.as-int   (local.get $primitive)))))
			(if (call $Vect.is-nat   (local.get $primitive)) (then (return_call $!i64.stringify_u (call $Vect.as-nat   (local.get $primitive)))))
			(if (call $Vect.is-float (local.get $primitive)) (then (return_call $!f64.stringify   (call $Vect.as-float (local.get $primitive)))))
			(unreachable)
		)
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



;; stringify a signed i64
(func $!i64.stringify_s (param $int i64) (result (ref $String))
	(unreachable) ;; TODO:
)
;; stringify an unsigned i64
(func $!i64.stringify_u (param $nat i64) (result (ref $String))
	(unreachable) ;; TODO:
)
;; stringify an f64
(func $!f64.stringify (param $float f64) (result (ref $String))
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
