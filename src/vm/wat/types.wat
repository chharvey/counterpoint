(rec
	;; # Dynamic Operation Types
	(type $i64.relop (func (param i64 i64) (result i32)))
	(type $f64.relop (func (param f64 f64) (result i32)))



	;; WASM representation of a Counterpoint value
	(type $Value (struct
		(field $tag       i8) ;; 1 = primitive, 2 = composite
		(field $primitive v128)
		(field $composite (ref null $Composite))
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



	;; # Implementations
	;; these implementations are used to build up Counterpoint objects.

	;; mutable to allow reassigning array entries, nullable because array can be sparse
	(type $ListInternal (array (mut (ref null $Value))))
	(type $DictInternal (array (mut (ref null $Property))))
	(type $MapInternal  (array (mut (ref null $Case))))

	(type $List (struct
		;; number of items currently in the array (for total capacity, get its `(array.len)`); mutable to allow array mutation
		(field $size (mut i32))
		;; the array of List items; mutable to allow reallocation
		(field $internal (mut (ref $ListInternal)))
	))
	(type $Dict (struct
		;; number of items currently in the array, including tombstones (for total capacity, get its `(array.len)`); mutable to allow array mutation
		(field $size (mut i32))
		;; the array of Dict properties; mutable to allow reallocation
		(field $internal (mut (ref $DictInternal)))
	))



	;; abstract root of all non-primitives. the type of `$Value.$composite`
	(type $Composite (sub (struct)))



	;; # Compound Value Types
	(type $StringInternal (array (mut i32))) ;; mutable to allow construction of templates
	(type $TupleInternal  (array (ref $Value)))
	(type $RecordInternal (array (ref $Property)))

	;; precursors to Counterpoint types
	(type $String (sub final $Composite (struct (field $internal (ref $StringInternal)))))
	(type $Tuple  (sub final $Composite (struct (field $internal (ref $TupleInternal)))))
	(type $Record (sub final $Composite (struct (field $internal (ref $RecordInternal)))))



	;; # Reference Types
	;; these are written here until we can build a core library in Counterpoint

	;; precursor to the Counterpoint `Object` root class
	(type $Object (sub $Composite (struct
		;; unique id for hashing
		(field $id i64)
	)))

	;; precursor to the Counterpoint `List` class
	(type $CplList (sub final $Object (struct
		;; --- inherited ---
		;; unique id for hashing
		(field $id i64)

		;; --- own ---
		;; the underlying implementation
		(field $list (ref $List))
	)))

	;; precursor to the Counterpoint `Dict` class
	(type $CplDict (sub final $Object (struct
		;; --- inherited ---
		;; unique id for hashing
		(field $id i64)

		;; --- own ---
		;; the underlying implementation
		(field $dict (ref $Dict))
	)))

	;; precursor to the Counterpoint `Map` class
	(type $Map (sub final $Object (struct
		;; --- inherited ---
		;; unique id for hashing
		(field $id i64)

		;; --- own ---
		;; number of items currently in the array, including tombstones (for total capacity, get its `(array.len)`); mutable to allow array mutation
		(field $size (mut i32))
		;; the array of Map cases; mutable to allow reallocation
		(field $internal (mut (ref $MapInternal)))
	)))

	;; precursor to the Counterpoint `Exception` class
	(type $Exception (sub final $Object (struct
		;; --- inherited ---
		;; unique id for hashing
		(field $id i64)

		;; --- own ---
		;; the error message
		(field $message (ref $String))
		;; a cause of this Exception
		(field $cause (ref null $Exception))
	)))

	;; precursor to the Counterpoint `Maybe` class
	(type $Maybe (sub final $Object (struct
		;; --- inherited ---
		;; unique id for hashing
		(field $id i64)

		;; --- own ---
		;; the potentially held value
		(field $value (ref null $Value))
	)))

	;; precursor to the Counterpoint `Result` class
	(type $Result (sub final $Object (struct
		;; --- inherited ---
		;; unique id for hashing
		(field $id i64)

		;; --- own ---
		;; the success value
		(field $value (ref null $Value))
		;; the failure reason
		(field $reason (ref null $Exception))
	)))

	;; precursor to the Counterpoint `Function` class
	(type $Function (sub final $Object (struct
		;; --- inherited ---
		;; unique id for hashing
		(field $id i64)

		;; --- own ---
		;; number of functional parameters
		(field $arity (mut i32))
	)))
)
