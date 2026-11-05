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
	(type $Map (struct
		;; number of items currently in the array, including tombstones (for total capacity, get its `(array.len)`); mutable to allow array mutation
		(field $size (mut i32))
		;; the array of Map cases; mutable to allow reallocation
		(field $internal (mut (ref $MapInternal)))
	))



	;; # Composite Types
	;; abstract root of all non-primitives. the type of `$Value.$composite`
	(type $Composite (sub (struct)))

	(type $StringInternal (array (mut i32))) ;; mutable to allow construction of templates
	(type $TupleInternal  (array (ref $Value)))
	(type $RecordInternal (array (ref $Property)))

	(type $String (sub final $Composite (struct (field $internal (ref $StringInternal)))))
	(type $Tuple  (sub final $Composite (struct (field $internal (ref $TupleInternal)))))
	(type $Record (sub final $Composite (struct (field $internal (ref $RecordInternal)))))

	;; an instance of any Counterpoint “data class”
	;; (these are called “data values”)
	(type $Data (sub final $Composite (struct
		;; each instance has a set of fields
		(field $fields (ref $Dict))
	)))

	;; an instance of the Counterpoint `Object` class (or any subclass)
	;; (these are called “reference objects”)
	(type $Object (sub $Composite (struct
		;; unique id for hashing
		(field $id i64)
		;; each instance has a set of fields
		(field $fields (ref $Dict))
	)))



	;; # Reference Types
	;; These are written here until we can build a core library in Counterpoint.
	;; They are only temporary, and resemble what the actual Counterpoint source code will look like.

	;; precursor to the Counterpoint `List` class
	(type $CplList (sub final $Object (struct
		;; --- inherited ---
		(field $id i64)
		(field $fields (ref $Dict))

		;; --- own ---
		;; the underlying implementation
		(field $list (ref $List))
	)))

	;; precursor to the Counterpoint `Dict` class
	(type $CplDict (sub final $Object (struct
		;; --- inherited ---
		(field $id i64)
		(field $fields (ref $Dict))

		;; --- own ---
		;; the underlying implementation
		(field $dict (ref $Dict))
	)))

	;; precursor to the Counterpoint `Map` class
	(type $CplMap (sub final $Object (struct
		;; --- inherited ---
		(field $id i64)
		(field $fields (ref $Dict))

		;; --- own ---
		;; the underlying implementation
		(field $map (ref $Map))
	)))

	;; precursor to the Counterpoint `Exception` class
	(type $Exception (sub final $Object (struct
		;; --- inherited ---
		(field $id i64)
		(field $fields (ref $Dict))

		;; --- own ---
		;; the error message
		(field $message (ref $String))
		;; a cause of this Exception
		(field $cause (ref null $Exception))
	)))

	;; precursor to the Counterpoint `Maybe` class
	(type $Maybe (sub final $Object (struct
		;; --- inherited ---
		(field $id i64)
		(field $fields (ref $Dict))

		;; --- own ---
		;; the potentially held value
		(field $value (ref null $Value))
	)))

	;; precursor to the Counterpoint `Result` class
	(type $Result (sub final $Object (struct
		;; --- inherited ---
		(field $id i64)
		(field $fields (ref $Dict))

		;; --- own ---
		;; the success value
		(field $value (ref null $Value))
		;; the failure reason
		(field $reason (ref null $Exception))
	)))

	;; precursor to the Counterpoint `Function` class
	(type $Function (sub final $Object (struct
		;; --- inherited ---
		(field $id i64)
		(field $fields (ref $Dict))

		;; --- own ---
		;; number of functional parameters
		(field $arity (mut i32))
	)))
)
