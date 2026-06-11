(func $Case.new-tombstone (result (ref $Case))
	(struct.new $Case
		(struct.new_default $Value)
		(struct.new_default $Value)
	)
)



(func $Case.is-tombstone (export "Case#isTombstone") (param $case (ref null $Case)) (result i32)
	(if (result i32)
		(ref.is_null (local.get $case))
		(then (i32.const 0))
		(else (i32.and
			(i32.eqz (struct.get $Value $tag (struct.get $Case $ant (local.get $case))))
			(i32.eqz (struct.get $Value $tag (struct.get $Case $con (local.get $case))))
		))
	)
)
