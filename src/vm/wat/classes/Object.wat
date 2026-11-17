(global $Object.ctr (mut i64) (i64.const 0x16)) ;; 0x00-0x15 are used in Class.wat



(func $Object.ctr-plus-plus (export "Object#ctrPlusPlus") (result i64)
	(global.get $Object.ctr) ;; place on stack to return later
	(global.set $Object.ctr (i64.add (global.get $Object.ctr) (i64.const 1)))
)



(func $Object.has-field (export "Object#hasField") (param $obj (ref $Object)) (param $key i64) (result i32)
	(local $fields (ref null $Dict))
	(local.set $fields (struct.get $Object $fields (local.get $obj)))
	(if
		(ref.is_null (local.get $fields))
		(then (return (i32.const 0)))
		(else (return_call $Dict.has-key (ref.as_non_null (local.get $fields)) (local.get $key)))
	)
)
(func $Object.get-field (export "Object#getField") (param $obj (ref $Object)) (param $key i64) (result (ref $Value))
	(return_call $Dict.get (ref.as_non_null (struct.get $Object $fields (local.get $obj))) (local.get $key))
)
(func $Object.set-field (export "Object#setField") (param $obj (ref $Object)) (param $key i64) (param $value (ref $Value))
	(return_call $Dict.set (ref.as_non_null (struct.get $Object $fields (local.get $obj))) (local.get $key) (local.get $value))
)
(func $Object.delete-field (export "Object#deleteField") (param $obj (ref $Object)) (param $key i64) (result (ref null $Value))
	(return_call $Dict.delete (ref.as_non_null (struct.get $Object $fields (local.get $obj))) (local.get $key))
)
