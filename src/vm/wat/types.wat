;; # Types
(rec
	;; dynamic operation types
	(type $i64.relop (func (param i64 i64) (result i32)))
	(type $f64.relop (func (param f64 f64) (result i32)))



	;; WASM representation of a Counterpoint value
	(type $Value (struct
		(field $tag       i8) ;; 1 = primitive, 2 = composite
		(field $primitive v128)
		(field $composite (ref null eq))
	))
	;; type of entry in records/Dicts
	(type $Property (struct
		(field $key i64)
		(field $val (ref $Value))
	))
	;; type of entry in Maps
	(type $Case (struct
		(field $ant (ref $Value))
		(field $con (ref $Value))
	))



	;; ## Compound Value Types
	(type $String (array (mut i8))) ;; mutable to allow construction of templates
	(type $Tuple  (array (ref $Value)))
	(type $Record (array (ref $Property)))



	;; ## Collection Internals: storage of items/properties
	;; mutable to allow reassigning array entries, nullable because array can be sparse
	(type $ListInternal (array (mut (ref null $Value))))
	(type $DictInternal (array (mut (ref null $Property))))
	(type $MapInternal  (array (mut (ref null $Case))))



	;; ## Counterpoint Classes

	;; a Counterpoint object; precursor to the `Object` root class
	(type $Object (sub (struct
		;; unique id for hashing
		(field $id i64)
	)))

	;; precursor to the `List` class
	(type $List (sub $Object (struct
		;; --- inherited ---
		;; unique id for hashing
		(field $id i64)

		;; --- own ---
		;; number of items currently in the array (for total capacity, get its `(array.len)`); mutable to allow array mutation
		(field $size (mut i32))
		;; the array of List items; mutable to allow reallocation
		(field $internal (mut (ref $ListInternal)))
	)))

	;; precursor to the `Dict` class
	(type $Dict (sub $Object (struct
		;; --- inherited ---
		;; unique id for hashing
		(field $id i64)

		;; --- own ---
		;; number of items currently in the array, including tombstones (for total capacity, get its `(array.len)`); mutable to allow array mutation
		(field $size (mut i32))
		;; the array of Dict properties; mutable to allow reallocation
		(field $internal (mut (ref $DictInternal)))
	)))

	;; precursor to the `Map` class
	(type $Map (sub $Object (struct
		;; --- inherited ---
		;; unique id for hashing
		(field $id i64)

		;; --- own ---
		;; number of items currently in the array, including tombstones (for total capacity, get its `(array.len)`); mutable to allow array mutation
		(field $size (mut i32))
		;; the array of Map cases; mutable to allow reallocation
		(field $internal (mut (ref $MapInternal)))
	)))

	;; precursor to the `Maybe` class
	(type $Maybe (sub final $Object (struct
		;; --- inherited ---
		;; unique id for hashing
		(field $id i64)

		;; --- own ---
		;; the potentially held value
		(field $value (ref null $Value))
	)))

	;; precursor to the `Function` class
	(type $Function (sub final $Object (struct
		;; --- inherited ---
		;; unique id for hashing
		(field $id i64)

		;; --- own ---
		;; number of functional parameters
		(field $arity (mut i32))
	)))
)
