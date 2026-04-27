;; # Stubs
;; Stubs are defined in this file so that they may be referenced by WAT but programmatically defined later.
;; They are removed via `binaryen.Module#removeFunction` and replaced by the CodeGenerator.



(func $vid (param $arg0 (ref $Value)) (param $arg1 (ref $Value)) (result (ref $Value))
	(unreachable)
)



(func $veq (param $arg0 (ref $Value)) (param $arg1 (ref $Value)) (result (ref $Value))
	(unreachable)
)



(func $bool-to-i32 (param $arg0 (ref $Value)) (result i32)
	(unreachable)
)



(func $Property.new-tombstone (result (ref $Property))
	(unreachable)
)



(func $Property.is-tombstone (param $prop (ref null $Property)) (result i32)
	(unreachable)
)



(func $Case.new-tombstone (result (ref $Case))
	(unreachable)
)



(func $Case.is-tombstone (param $case (ref null $Case)) (result i32)
	(unreachable)
)
