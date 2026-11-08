(rec
	;; # Dynamic Operation Types
	(type $i64.relop (func (param i64 i64) (result i32)))
	(type $f64.relop (func (param f64 f64) (result i32)))
	(type $Value.relop (func (param (ref $Value) (ref $Value)) (result (ref $Value))))




	;; # Implementations
	;; these implementations are used to build up Counterpoint objects.
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

	(type $String (array (mut i32))) ;; mutable to allow construction of templates
	(type $Tuple  (array (ref $Value)))
	(type $Record (array (ref $Property)))

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

	;; abstract root of all non-primitives. the type of `$Value.$composite`
	(type $Composite (sub (struct)))




	;; # All Values

	;; WASM representation of a Counterpoint value
	(type $Value (struct
		(field $tag       i8) ;; 1 = primitive, 2 = composite
		(field $primitive v128)
		(field $composite (ref null $Composite))
	))

	(type $Data (sub final $Composite (struct
		;; pointer to the constructor class
		(field $class (ref $Class))
		;; each instance has a set of fields
		(field $fields (ref null $Dict))
	)))
	(type $Object (sub $Composite (struct
		;; unique id for hashing
		(field $id i64)
		;; pointer to the constructor class
		(field $class (ref null $Class))
		;; each instance has a set of fields
		(field $fields (ref null $Dict))
	)))
	(type $Class (sub final $Object (struct
		;; --- inherited ---
		(field $id i64)
		(field $class (ref null $Class)) ;; (if null, it means this field should refer to its containing struct)
		(field $fields (ref null $Dict))
	)))



	;; ## Counterpoint Precursor Classes
	;; These are written here until we can build a core library in Counterpoint.
	;; They are only temporary, and resemble what the actual Counterpoint source code will look like.
	;; The fields listed here are hard-coded, but will eventually be moved to the `$fields` field,
	;; once these classes are dynamically code-generated.


	;; ### “Value” Types (id-by-value)
	(type $Cpl-String (sub final $Composite (struct (field $internal (ref $String)))))
	(type $Cpl-Tuple  (sub final $Composite (struct (field $internal (ref $Tuple)))))
	(type $Cpl-Record (sub final $Composite (struct (field $internal (ref $Record)))))


	;; ### Reference Types (id-by-reference)
	;; precursor to the Counterpoint `List` class
	(type $CplList (sub final $Object (struct
		;; --- inherited ---
		(field $id i64)
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))

		;; --- own ---
		;; the underlying implementation
		(field $list (ref $List))
	)))
	;; precursor to the Counterpoint `Dict` class
	(type $CplDict (sub final $Object (struct
		;; --- inherited ---
		(field $id i64)
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))

		;; --- own ---
		;; the underlying implementation
		(field $dict (ref $Dict))
	)))
	;; precursor to the Counterpoint `Map` class
	(type $CplMap (sub final $Object (struct
		;; --- inherited ---
		(field $id i64)
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))

		;; --- own ---
		;; the underlying implementation
		(field $map (ref $Map))
	)))
	;; precursor to the Counterpoint `Exception` class
	(type $Exception (sub final $Object (struct
		;; --- inherited ---
		(field $id i64)
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))

		;; --- own ---
		;; the error message
		(field $message (ref $Cpl-String))
		;; a cause of this Exception
		(field $cause (ref null $Exception))
	)))
	;; precursor to the Counterpoint `Maybe` class
	(type $Maybe (sub final $Object (struct
		;; --- inherited ---
		(field $id i64)
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))

		;; --- own ---
		;; the potentially held value
		(field $value (ref null $Value))
	)))
	;; precursor to the Counterpoint `Result` class
	(type $Result (sub final $Object (struct
		;; --- inherited ---
		(field $id i64)
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))

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
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))

		;; --- own ---
		;; number of functional parameters
		(field $arity (mut i32))
	)))
)
