;; ## Main Stringify Function ##
(func $Value.stringify (export "Value#stringify") (param $value (ref $Value)) (result (ref $String))
	(local $primitive v128)
	(local $composite (ref null eq))

	(local.set $primitive (struct.get $Value $primitive (local.get $value)))
	(local.set $composite (struct.get $Value $composite (local.get $value)))

	(if
		(call $Value.is-primitive (local.get $value))
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
		(call $Value.is-composite (local.get $value))
		(then
			(if (ref.test (ref $String) (local.get $composite)) (then (return (ref.cast (ref $String) (local.get $composite)))))
			(if (ref.test (ref $Tuple)  (local.get $composite)) (then (return_call $!Tuple.stringify  (ref.cast (ref $Tuple)  (local.get $composite)))))
			(if (ref.test (ref $Record) (local.get $composite)) (then (return_call $!Record.stringify (ref.cast (ref $Record) (local.get $composite)))))
			(if (ref.test (ref $Object) (local.get $composite)) (then (return_call $!Object.stringify (ref.cast (ref $Object) (local.get $composite)))))
		)
	)
	(unreachable)
)



;; stringify a signed i64 in base ten
(func $!i64.stringify_s (param $int i64) (result (ref $String))
	(local $is-negative i32)
	(local $copy        i64)
	(local $rem         i64)
	(local $string      (ref $String))
	(local $length      i32)
	(local $index       i32)

	(if
		(i64.eqz (local.get $int))
		(then (return (array.new_fixed $String 1 (i32.const 0x30)))) ;; UTF8_codeunit('0')
	)

	;; force the copy to be negative to handle the `i64::min_s` overflow case (`-(2 ^ 63)`)
	(if
		(i64.lt_s (local.get $int) (i64.const 0))
		(then
			(local.set $copy        (local.get $int))
			(local.set $is-negative (i32.const 1))
			(local.set $length      (i32.const 1)) ;; include the `-` character
		)
		(else
			;; `$int` is positive; negate it to make it negative
			(local.set $copy        (i64.sub (i64.const 0) (local.get $int)))
			(local.set $is-negative (i32.const 0))
			(local.set $length      (i32.const 0))
		)
	)

	;; compute needed length of string
	(block $exit
		(loop $repeat
			(local.set $length (i32.add (local.get $length) (i32.const 1)))
			(local.set $copy (i64.div_s (local.get $copy) (i64.const 10)))
			(br_if $exit (i64.eqz (local.get $copy)))
			(br $repeat)
		)
	)
	(local.set $string (array.new_default $String (local.get $length)))

	;; re-initialize `$copy` for string population
	(local.set $copy (if (result i64)
		(local.get $is-negative)
		(then (local.get $int))
		(else (i64.sub (i64.const 0) (local.get $int)))
	))

	;; populate string
	(local.set $index (i32.sub (local.get $length) (i32.const 1))) ;; insert digits from least to most significant (right to left)
	(block $exit
		(loop $repeat
			(local.set $rem (i64.rem_s (local.get $copy) (i64.const 10)))
			(array.set $String
				(local.get $string)
				(local.get $index)
				(i32.sub (i32.const 0x30) (i32.wrap_i64 (local.get $rem))) ;; with rem <= 0, UTF8_codeunit(abs(rem)) == UTF8_codeunit('0') - rem
			)
			(local.set $copy (i64.div_s (local.get $copy) (i64.const 10)))
			(local.set $index (i32.sub (local.get $index) (i32.const 1)))
			(br_if $exit (i64.eqz (local.get $copy)))
			(br $repeat)
		)
	)
	;; prepend negative sign if necessary
	(if
		(local.get $is-negative)
		(then (array.set $String
			(local.get $string)
			(i32.const 0)
			(i32.const 0x2d) ;; UTF8_codeunit('-')
		))
	)

	(local.get $string)
)
;; stringify an unsigned i64 in base ten
(func $!i64.stringify_u (param $nat i64) (result (ref $String))
	(local $copy   i64)
	(local $rem    i64)
	(local $string (ref $String))
	(local $length i32)
	(local $index  i32)

	(if
		(i64.eqz (local.get $nat))
		(then (return (array.new_fixed $String 1 (i32.const 0x30)))) ;; UTF8_codeunit('0')
	)

	(local.set $copy   (local.get $nat))
	(local.set $length (i32.const 0))

	;; compute needed length of string
	(block $exit
		(loop $repeat
			(local.set $length (i32.add (local.get $length) (i32.const 1)))
			(local.set $copy (i64.div_u (local.get $copy) (i64.const 10)))
			(br_if $exit (i64.eqz (local.get $copy)))
			(br $repeat)
		)
	)
	(local.set $string (array.new_default $String (local.get $length)))

	;; re-initialize `$copy` for string population
	(local.set $copy (local.get $nat))

	;; populate string
	(local.set $index (i32.sub (local.get $length) (i32.const 1))) ;; insert digits from least to most significant (right to left)
	(block $exit
		(loop $repeat
			(local.set $rem (i64.rem_u (local.get $copy) (i64.const 10)))
			(array.set $String
				(local.get $string)
				(local.get $index)
				(i32.add (i32.const 0x30) (i32.wrap_i64 (local.get $rem))) ;; with digit >= 0, UTF8_codeunit(digit) == UTF8_codeunit('0') + digit
			)
			(local.set $copy (i64.div_u (local.get $copy) (i64.const 10)))
			(local.set $index (i32.sub (local.get $index) (i32.const 1)))
			(br_if $exit (i64.eqz (local.get $copy)))
			(br $repeat)
		)
	)

	(local.get $string)
)
;; stringify an f64 in base ten
(func $!f64.stringify (param $float f64) (result (ref $String))
	(unreachable) ;; TODO:
)
;; stringify a $Tuple
(func $!Tuple.stringify (param $tuple (ref $Tuple)) (result (ref $String))
	(unreachable) ;; TODO:
)
;; stringify a $Record
(func $!Record.stringify (param $record (ref $Record)) (result (ref $String))
	(unreachable) ;; TODO:
)
;; stringify an $Object
(func $!Object.stringify (param $object (ref $Object)) (result (ref $String))
	(unreachable) ;; TODO:
)
