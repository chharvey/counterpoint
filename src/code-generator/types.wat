;; # Common Types

;; WASM representation of a Counterpoint value
(type $Value (struct
	(field $tag       i8) ;; 0 = primitive, 1 = composite
	(field $primitive v128)
	(field $composite eqref) ;; (ref null eq)
))

;; type of entry in records/Dicts
(type $Property (struct
	(field $key   i32)
	(field $value (ref $Value))
))



;; ## Compound Value Types: tuples and records
(type $Tuple  (array (ref $Value)))
(type $Record (array (ref $Property)))



;; ## List/Dict Internals: storage of items/properties
;; mutable to allow reassigning array entries, nullable because array can be sparse
(type $ListInternal (array (mut (ref null $Value))))
(type $DictInternal (array (mut (ref null $Property))))



;; a Counterpoint object; precursor to the `Object` root class
(type $Object (sub (struct
)))

;; precursor to the `List` class
(type $List (sub $Object (struct
	;; number of items currently in the array (for total capacity, get its `(array.len)`); mutable to allow array mutation
	(field $size (mut i32))
	;; the array of values; mutable to allow reallocation
	(field $internal (mut (ref $ListInternal)))
)))

;; precursor to the `Dict` class
(type $Dict (sub $Object (struct
	;; number of items currently in the array, including tombstones (for total capacity, get its `(array.len)`); mutable to allow array mutation
	(field $size (mut i32))
	;; the array of values; mutable to allow reallocation
	(field $internal (mut (ref $DictInternal)))
)))
