(func $Value.is-primitive (param $value (ref $Value)) (result i32)
	(i32.eq (struct.get $Value $tag (local.get $value)) (i32.const 1))
)



(func $Value.is-composite (param $value (ref $Value)) (result i32)
	(i32.eq (struct.get $Value $tag (local.get $value)) (i32.const 2))
)
