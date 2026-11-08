(global $Object.ctr (mut i64) (i64.const 21)) ;; 0–20 are used in Class.wat



(func $Object.ctr-plus-plus (export "Object#ctrPlusPlus") (result i64)
	(global.get $Object.ctr) ;; place on stack to return later
	(global.set $Object.ctr (i64.add (global.get $Object.ctr) (i64.const 1)))
)



(func $Object.get-field (export "Object#getField") (param $obj (ref $Object)) (param $key i64) (result (ref $Value))
	(return_call $Dict.get (struct.get $Object $fields (local.get $obj)) (local.get $key))
)
(func $Object.set-field (export "Object#setField") (param $obj (ref $Object)) (param $key i64) (param $value (ref $Value))
	(return_call $Dict.set (struct.get $Object $fields (local.get $obj)) (local.get $key) (local.get $value))
)
(func $Object.delete-field (export "Object#deleteField") (param $obj (ref $Object)) (param $key i64) (result (ref null $Value))
	(return_call $Dict.delete (struct.get $Object $fields (local.get $obj)) (local.get $key))
)
