(global $Property.TOMBSTONE (export "Property#TOMBSTONE") (ref $Property) (struct.new $Property
	(i64.const 0x7f)
	(struct.new_default $Value)
))



(func $Property.from-tuple (param (ref $TupleInternal)) (result i64 (ref $Value))
	(call $Vect.as-nat (struct.get $Value $primitive (array.get $TupleInternal (local.get 0) (i32.const 0))))
	(array.get $TupleInternal (local.get 0) (i32.const 1))
)
(func $Property.from-case (param (ref $Case)) (result i64 (ref $Value))
	(call $Vect.as-nat (struct.get $Value $primitive (struct.get $Case $ant (local.get 0))))
	(struct.get $Case $con (local.get 0))
)
