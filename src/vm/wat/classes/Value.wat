(global $Value.NULL (export "Value#NULL") (ref $Value) (struct.new $Value
	(i32.const 1)
	(global.get $Vect.NULL)
	(ref.null $Composite)
))
(global $Value.FALSE (export "Value#FALSE") (ref $Value) (struct.new $Value
	(i32.const 1)
	(global.get $Vect.FALSE)
	(ref.null $Composite)
))
(global $Value.TRUE (export "Value#TRUE") (ref $Value) (struct.new $Value
	(i32.const 1)
	(global.get $Vect.TRUE)
	(ref.null $Composite)
))



(func $Value.new-primitive (export "Value#newPrimitive") (param $primitive v128) (result (ref $Value))
	(struct.new $Value
		(i32.const 1)
		(local.get $primitive)
		(ref.null $Composite)
	)
)



(func $Value.new-composite (export "Value#newComposite") (param $composite (ref $Composite)) (result (ref $Value))
	(struct.new $Value
		(i32.const 2)
		(global.get $Vect.VOID)
		(local.get $composite)
	)
)



(func $Value.is-primitive (export "Value#isPrimitive") (param $value (ref $Value)) (result i32)
	(i32.eq (struct.get $Value $tag (local.get $value)) (i32.const 1))
)



(func $Value.is-composite (export "Value#isComposite") (param $value (ref $Value)) (result i32)
	(i32.eq (struct.get $Value $tag (local.get $value)) (i32.const 2))
)



(func $Value.bool-to-i32 (export "Value#boolToI32") (param $value (ref $Value)) (result i32)
	(call $Vect.is-true (struct.get $Value $primitive (local.get $value)))
)



(func $Value.bool-from-i32 (export "Value#boolFromI32") (param $bool i32) (result (ref $Value))
	(if (result (ref $Value))
		(local.get $bool)
		(then (global.get $Value.TRUE))
		(else (global.get $Value.FALSE))
	)
)



(func $Value.from-string (export "Value#fromString") (param (ref $String)) (result (ref $Value))
	(return_call $Value.new-composite (struct.new $Cpl-String (local.get 0)))
)
(func $Value.from-tuple (export "Value#fromTuple") (param (ref $Tuple)) (result (ref $Value))
	(return_call $Value.new-composite (struct.new $Cpl-Tuple (local.get 0)))
)
(func $Value.from-record (export "Value#fromRecord") (param (ref $Record)) (result (ref $Value))
	(return_call $Value.new-composite (struct.new $Cpl-Record (local.get 0)))
)



(func $Value.from-list (export "Value#fromList") (param (ref $List)) (result (ref $Value))
	(return_call $Value.new-composite
		(struct.new $Cpl-List
			(call $Object.ctr-plus-plus)
			(global.get $Class.LIST)
			(ref.null $Dict)
			(local.get 0)
		)
	)
)
(func $Value.from-dict (export "Value#fromDict") (param (ref $Dict)) (result (ref $Value))
	(return_call $Value.new-composite
		(struct.new $Cpl-Dict
			(call $Object.ctr-plus-plus)
			(global.get $Class.DICT)
			(ref.null $Dict)
			(local.get 0)
		)
	)
)
(func $Value.from-map (export "Value#fromMap") (param (ref $Map)) (result (ref $Value))
	(return_call $Value.new-composite
		(struct.new $Cpl-Map
			(call $Object.ctr-plus-plus)
			(global.get $Class.MAP)
			(ref.null $Dict)
			(local.get 0)
		)
	)
)



(func $Value.as-string (export "Value#asString") (param (ref $Value)) (result (ref $String))
	(struct.get $Cpl-String $string (ref.cast (ref $Cpl-String) (struct.get $Value $composite (local.get 0))))
)
(func $Value.as-tuple (export "Value#asTuple") (param (ref $Value)) (result (ref $Tuple))
	(struct.get $Cpl-Tuple $tuple (ref.cast (ref $Cpl-Tuple) (struct.get $Value $composite (local.get 0))))
)
(func $Value.as-record (export "Value#asRecord") (param (ref $Value)) (result (ref $Record))
	(struct.get $Cpl-Record $record (ref.cast (ref $Cpl-Record) (struct.get $Value $composite (local.get 0))))
)



(func $Value.as-list (export "Value#asList") (param (ref $Value)) (result (ref $List))
	(struct.get $Cpl-List $list (ref.cast (ref $Cpl-List) (struct.get $Value $composite (local.get 0))))
)
(func $Value.as-dict (export "Value#asDict") (param (ref $Value)) (result (ref $Dict))
	(struct.get $Cpl-Dict $dict (ref.cast (ref $Cpl-Dict) (struct.get $Value $composite (local.get 0))))
)
(func $Value.as-map (export "Value#asMap") (param (ref $Value)) (result (ref $Map))
	(struct.get $Cpl-Map $map (ref.cast (ref $Cpl-Map) (struct.get $Value $composite (local.get 0))))
)



(func $Value.as-data (export "Value#asData") (param (ref $Value)) (result (ref $Data))
	(ref.cast (ref $Data) (struct.get $Value $composite (local.get 0)))
)
(func $Value.as-object (export "Value#asObject") (param (ref $Value)) (result (ref $Object))
	(ref.cast (ref $Object) (struct.get $Value $composite (local.get 0)))
)
(func $Value.as-class (export "Value#asClass") (param (ref $Value)) (result (ref $Class))
	(ref.cast (ref $Class) (struct.get $Value $composite (local.get 0)))
)
