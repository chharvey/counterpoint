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
	;; TODO: call $Vect.is-true
	(i32.eq
		(i16x8.extract_lane_u 3 (struct.get $Value $primitive (local.get $value)))
		(i32.const 0x0003)
	)
)



(func $Value.bool-from-i32 (param $bool i32) (result (ref $Value))
	(if (result (ref $Value))
		(local.get $bool)
		;; TODO: use $Vect consts
		(then (struct.new $Value (i32.const 1) (v128.const i16x8 0 0 0 0x0003 0 0 0 0) (ref.null eq)))
		(else (struct.new $Value (i32.const 1) (v128.const i16x8 0 0 0 0x0002 0 0 0 0) (ref.null eq)))
	)
)
