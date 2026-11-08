(global $Case.TOMBSTONE (export "Case#TOMBSTONE") (ref $Case) (struct.new $Case
	(struct.new_default $Value)
	(struct.new_default $Value)
))



(func $Case.from-tuple (param (ref $TupleInternal)) (result (ref $Value) (ref $Value))
	(array.get $TupleInternal (local.get 0) (i32.const 0))
	(array.get $TupleInternal (local.get 0) (i32.const 1))
)
