(global $Property.TOMBSTONE (export "Property#TOMBSTONE") (ref $Property) (struct.new $Property
	(i64.const 0x7f)
	(struct.new_default $Value)
))



(func $Property.from-tuple (param (ref $Tuple)) (result i64 (ref $Value))
	(call $Vect.as-nat (call $Value.as-primitive (array.get $Tuple (local.get 0) (i32.const 0))))
	(array.get $Tuple (local.get 0) (i32.const 1))
)
(func $Property.from-case (param (ref $Case)) (result i64 (ref $Value))
	(call $Vect.as-nat (call $Value.as-primitive (struct.get $Case $ant (local.get 0))))
	(struct.get $Case $con (local.get 0))
)
