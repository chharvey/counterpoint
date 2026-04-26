(func $Value.is-primitive (param $value (ref $Value)) (result i32)
	(i32.eq (struct.get $Value $tag (local.get $value)) (i32.const 1))
)



(func $Value.is-composite (param $value (ref $Value)) (result i32)
	(i32.eq (struct.get $Value $tag (local.get $value)) (i32.const 2))
)



(func $Value.bool-from-i32 (param $bool i32) (result (ref $Value))
	(if (result (ref $Value))
		(local.get $bool)
		(else (struct.new $Value (i32.const 1) (v128.const i16x8 0 0 0 0x0003 0 0 0 0) (ref.null eq)))
		(then (struct.new $Value (i32.const 1) (v128.const i16x8 0 0 0 0x0002 0 0 0 0) (ref.null eq)))
	)
)
