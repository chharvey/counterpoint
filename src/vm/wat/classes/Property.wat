(func $Property.new-tombstone (result (ref $Property))
	(struct.new $Property
		(i64.const 0x7f)
		(struct.new_default $Value)
	)
)



(func $Property.is-tombstone (export "Property#isTombstone") (param $prop (ref null $Property)) (result i32)
	(if (result i32)
		(ref.is_null (local.get $prop))
		(then (i32.const 0))
		(else (i64.lt_u (struct.get $Property $key (local.get $prop)) (i64.const 0x80)))
	)
)
