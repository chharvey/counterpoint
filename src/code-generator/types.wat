;; # Common Types

;; a Counterpoint object; extended by every subclass
(type $Object (sub (struct
)))

;; WASM representation of a Counterpoint value
(type $Value (struct
	(field $tag       i8) ;; 0 = primitive, 1 = composite
	(field $primitive v128)
	(field $composite (ref null $Object))
))



;; internal holding of List items
(type $ListInternal (array (mut (ref null $Value)))) ;; mutable to allow reassigning array entries

;; precursor to the `List` class
(type $List (sub $Object (struct
	(field $count (mut v128))                ;; number of items currently in the array (for total capacity, get its `(array.len)`); mutable to allow array mutation
	(field $array (mut (ref $ListInternal))) ;; the array of values; mutable to allow reallocation
)))



;; type of entry in every Dict
(type $DictEntry (struct
	(field $key   i64)
	(field $value (ref $Value))
))

;; internal holding of Dict entries
(type $DictInternal (array (mut (ref null $DictEntry)))) ;; mutable to allow reassigning array entries

;; precursor to the `Dict` class
(type $Dict (sub $Object (struct
	(field $count (mut v128))                ;; number of items currently in the array (for total capacity, get its `(array.len)`); mutable to allow array mutation
	(field $array (mut (ref $DictInternal))) ;; the array of values; mutable to allow reallocation
)))
