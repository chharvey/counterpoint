;; a Counterpoint object; precursor to the `Object` root class
(type $Object (sub (struct
	;; unique id for hashing
	(field $id i64)
)))



(global $Object.ctr (mut i64) (i64.const 0))



(func $Object.ctr-plus-plus (result i64)
	(global.get $Object.ctr) ;; place on stack to return later
	(global.set $Object.ctr (i64.add (global.get $Object.ctr) (i64.const 1)))
)
