;; WASM representation of a Counterpoint value
(type $Value (struct
	(field $tag       i8) ;; 1 = primitive, 2 = composite
	(field $primitive v128)
	(field $composite eqref) ;; (ref null eq)
))



(func $Value.new-primitive (param $primitive v128) (result (ref $Value))
	(struct.new $Value
		(i32.const 1)
		(local.get $primitive)
		(ref.null eq)
	)
)



(func $Value.new-composite (param $composite (ref eq)) (result (ref $Value))
	(struct.new $Value
		(i32.const 2)
		(global.get $Vect.VOID)
		(local.get $composite)
	)
)



(func $Value.is-primitive (param $value (ref $Value)) (result i32)
	(i32.eq (struct.get $Value $tag (local.get $value)) (i32.const 1))
)



(func $Value.is-composite (param $value (ref $Value)) (result i32)
	(i32.eq (struct.get $Value $tag (local.get $value)) (i32.const 2))
)



(func $Value.bool-to-i32 (param $value (ref $Value)) (result i32)
	(call $Vect.is-true (struct.get $Value $primitive (local.get $value)))
)



(func $Value.bool-from-i32 (param $bool i32) (result (ref $Value))
	(if (result (ref $Value))
		(local.get $bool)
		(then (call $Value.new-primitive (global.get $Vect.TRUE)))
		(else (call $Value.new-primitive (global.get $Vect.FALSE)))
	)
)
