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
	(type $ListArray (array (mut (ref null $Value))))
	(type $DictArray (array (mut (ref null $Property))))
	(type $MapArray  (array (mut (ref null $Case))))

	(type $List (struct
		;; number of items currently in the array (for total capacity, get its `(array.len)`); mutable to allow array mutation
		(field $size (mut i32))
		;; the array of List items; mutable to allow reallocation
		(field $array (mut (ref $ListArray)))
	))
	(type $Dict (struct
		;; number of items currently in the array, including tombstones (for total capacity, get its `(array.len)`); mutable to allow array mutation
		(field $size (mut i32))
		;; the array of Dict properties; mutable to allow reallocation
		(field $array (mut (ref $DictArray)))
	))
	(type $Map (struct
		;; number of items currently in the array, including tombstones (for total capacity, get its `(array.len)`); mutable to allow array mutation
		(field $size (mut i32))
		;; the array of Map cases; mutable to allow reallocation
		(field $array (mut (ref $MapArray)))
	))




	;; # All Values

	;; WASM representation of a Counterpoint value
	(type $Value (sub (struct
		;; pointer to the constructor class
		(field $class (ref null $Class))
		;; each instance has a set of fields
		(field $fields (ref null $Dict))
	)))

	(type $Data (sub $Value (struct
		;; --- inherited ---
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))
	)))
	(type $Object (sub $Value (struct
		;; --- inherited ---
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))

		;; --- own ---
		;; unique id for hashing
		(field $id i64)
	)))
	(type $Class (sub final $Object (struct
		;; --- inherited ---
		(field $class (ref null $Class)) ;; if null, it means this object points to itself
		(field $fields (ref null $Dict))
		(field $id i64)

		;; TODO: ;; --- own ---
		;; TODO: ;; the parent class that this class extends
		;; TODO: (field $super (ref null $Class))
	)))



	;; ## Counterpoint Precursor Classes
	;; These are written here until we can build a core library in Counterpoint.
	;; They are only temporary, and resemble what the actual Counterpoint source code will look like.
	;; The fields listed here are hard-coded, but will eventually be moved to the `$fields` field,
	;; once these classes are dynamically code-generated.


	;; ### “Value” Types (id-by-value)
	;; precursor to the Counterpoint classes `Null`, `Boolean`, `Symbol`, `Integer`, `Natural`, `Float`
	(type $Cpl-Primitive (sub final $Data (struct
		;; --- inherited ---
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))

		;; --- own ---
		;; the stored value
		(field $bits v128)
	)))
	;; precursor to the Counterpoint `String` class
	(type $Cpl-String (sub final $Data (struct
		;; --- inherited ---
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))

		;; --- own ---
		;; the stored value
		(field $string (ref $String))
	)))
	(type $Cpl-Tuple (sub final $Data (struct
		;; --- inherited ---
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))

		;; --- own ---
		;; the stored value
		(field $tuple (ref $Tuple))
	)))
	(type $Cpl-Record (sub final $Data (struct
		;; --- inherited ---
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))

		;; --- own ---
		;; the stored value
		(field $record (ref $Record))
	)))


	;; ### Reference Types (id-by-reference)
	;; precursor to the Counterpoint `List` class
	(type $Cpl-List (sub final $Object (struct
		;; --- inherited ---
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))
		(field $id i64)

		;; --- own ---
		;; the stored value
		(field $list (ref $List))
	)))
	;; precursor to the Counterpoint `Dict` class
	(type $Cpl-Dict (sub final $Object (struct
		;; --- inherited ---
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))
		(field $id i64)

		;; --- own ---
		;; the stored value
		(field $dict (ref $Dict))
	)))
	;; precursor to the Counterpoint `Map` class
	(type $Cpl-Map (sub final $Object (struct
		;; --- inherited ---
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))
		(field $id i64)

		;; --- own ---
		;; the stored value
		(field $map (ref $Map))
	)))
	;; precursor to the Counterpoint `Exception` class
	(type $Exception (sub final $Object (struct
		;; --- inherited ---
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))
		(field $id i64)

		;; --- own ---
		;; the error message
		(field $message (ref $Cpl-String))
		;; a cause of this Exception
		(field $cause (ref null $Exception))
	)))
	;; precursor to the Counterpoint `Maybe` class
	(type $Maybe (sub final $Object (struct
		;; --- inherited ---
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))
		(field $id i64)

		;; --- own ---
		;; the potentially held value
		(field $value (ref null $Value))
	)))
	;; precursor to the Counterpoint `Result` class
	(type $Result (sub final $Object (struct
		;; --- inherited ---
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))
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
		(field $class (ref null $Class))
		(field $fields (ref null $Dict))
		(field $id i64)

		;; --- own ---
		;; number of functional parameters
		(field $arity (mut i32))
	)))
)
