;; # Stubs
;; Stubs are defined in this file so that they may be referenced by WAT but programmatically defined later.
;; They are removed via `binaryen.Module#removeFunction` and replaced by the CodeGenerator.



(func $veq (param $arg0 (ref $Value)) (param $arg1 (ref $Value)) (result (ref $Value))
	(unreachable)
)
