;; # Logical Negation Operator for Integers
;; Returns false, as Integers are always truthy.
;; This function is still needed so that runtime evaluation of arguments is still performed.
(func $inot (param $p0 i32) (result i32)
	(i32.const 0)
)



;; # Logical Negation Operator for Floats
;; Returns false, as Floats are always truthy.
;; This function is still needed so that runtime evaluation of arguments is still performed.
(func $fnot (param $p0 f64) (result i32)
	(i32.const 0)
)
