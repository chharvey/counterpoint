(global $Value.NULL (export "Value#NULL") (ref $Cpl-Primitive) (struct.new $Cpl-Primitive
	(global.get $Class.NULL)
	(ref.null $Dict)
	(global.get $Vect.NULL)
))
(global $Value.FALSE (export "Value#FALSE") (ref $Cpl-Primitive) (struct.new $Cpl-Primitive
	(global.get $Class.BOOLEAN)
	(ref.null $Dict)
	(global.get $Vect.FALSE)
))
(global $Value.TRUE (export "Value#TRUE") (ref $Cpl-Primitive) (struct.new $Cpl-Primitive
	(global.get $Class.BOOLEAN)
	(ref.null $Dict)
	(global.get $Vect.TRUE)
))



(func $Value.bool-to-i32 (export "Value#boolToI32") (param $value (ref $Value)) (result i32)
	(call $Vect.is-true (call $Value.as-primitive (local.get $value)))
)



(func $Value.bool-from-i32 (export "Value#boolFromI32") (param $bool i32) (result (ref $Value))
	(if (result (ref $Value))
		(local.get $bool)
		(then (global.get $Value.TRUE))
		(else (global.get $Value.FALSE))
	)
)



(func $Value.from-int (export "Value#fromInt") (param v128) (result (ref $Cpl-Primitive))
	(struct.new $Cpl-Primitive
		(global.get $Class.INTEGER)
		(ref.null $Dict)
		(local.get 0)
	)
)
(func $Value.from-nat (export "Value#fromNat") (param v128) (result (ref $Cpl-Primitive))
	(struct.new $Cpl-Primitive
		(global.get $Class.NATURAL)
		(ref.null $Dict)
		(local.get 0)
	)
)
(func $Value.from-float (export "Value#fromFloat") (param v128) (result (ref $Cpl-Primitive))
	(struct.new $Cpl-Primitive
		(global.get $Class.FLOAT)
		(ref.null $Dict)
		(local.get 0)
	)
)



(func $Value.from-string (export "Value#fromString") (param (ref $String)) (result (ref $Cpl-String))
	(struct.new $Cpl-String
		(global.get $Class.STRING)
		(ref.null $Dict)
		(local.get 0)
	)
)
(func $Value.from-tuple (export "Value#fromTuple") (param (ref $Tuple)) (result (ref $Cpl-Tuple))
	(struct.new $Cpl-Tuple
		(global.get $Class.DATA)
		(ref.null $Dict)
		(local.get 0)
	)
)
(func $Value.from-record (export "Value#fromRecord") (param (ref $Record)) (result (ref $Cpl-Record))
	(struct.new $Cpl-Record
		(global.get $Class.DATA)
		(ref.null $Dict)
		(local.get 0)
	)
)



(func $Value.from-list (export "Value#fromList") (param (ref $List)) (result (ref $Cpl-List))
	(struct.new $Cpl-List
		(global.get $Class.LIST)
		(ref.null $Dict)
		(call $Object.ctr-plus-plus)
		(local.get 0)
	)
)
(func $Value.from-dict (export "Value#fromDict") (param (ref $Dict)) (result (ref $Cpl-Dict))
	(struct.new $Cpl-Dict
		(global.get $Class.DICT)
		(ref.null $Dict)
		(call $Object.ctr-plus-plus)
		(local.get 0)
	)
)
(func $Value.from-map (export "Value#fromMap") (param (ref $Map)) (result (ref $Cpl-Map))
	(struct.new $Cpl-Map
		(global.get $Class.MAP)
		(ref.null $Dict)
		(call $Object.ctr-plus-plus)
		(local.get 0)
	)
)



(func $Value.as-primitive (export "Value#asPrimitive") (param (ref $Value)) (result v128)          (struct.get $Cpl-Primitive $bits   (ref.cast (ref $Cpl-Primitive) (local.get 0))))
(func $Value.as-string    (export "Value#asString")    (param (ref $Value)) (result (ref $String)) (struct.get $Cpl-String    $string (ref.cast (ref $Cpl-String)    (local.get 0))))
(func $Value.as-tuple     (export "Value#asTuple")     (param (ref $Value)) (result (ref $Tuple))  (struct.get $Cpl-Tuple     $tuple  (ref.cast (ref $Cpl-Tuple)     (local.get 0))))
(func $Value.as-record    (export "Value#asRecord")    (param (ref $Value)) (result (ref $Record)) (struct.get $Cpl-Record    $record (ref.cast (ref $Cpl-Record)    (local.get 0))))
(func $Value.as-list      (export "Value#asList")      (param (ref $Value)) (result (ref $List))   (struct.get $Cpl-List      $list   (ref.cast (ref $Cpl-List)      (local.get 0))))
(func $Value.as-dict      (export "Value#asDict")      (param (ref $Value)) (result (ref $Dict))   (struct.get $Cpl-Dict      $dict   (ref.cast (ref $Cpl-Dict)      (local.get 0))))
(func $Value.as-map       (export "Value#asMap")       (param (ref $Value)) (result (ref $Map))    (struct.get $Cpl-Map       $map    (ref.cast (ref $Cpl-Map)       (local.get 0))))
