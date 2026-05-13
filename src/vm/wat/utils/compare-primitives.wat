(func $compare-primitives
	(param $vect0 v128)
	(param $vect1 v128)
	(param $compare-ints   (ref $i64.relop))
	(param $compare-nats   (ref $i64.relop))
	(param $compare-floats (ref $f64.relop))
	(result i32)

	(if
		(call $Vect.is-int (local.get $vect0))
		(then
			(if (call $Vect.is-int   (local.get $vect1)) (then (return_call_ref $i64.relop (call $Vect.as-int       (local.get $vect0)) (call $Vect.as-int   (local.get $vect1)) (local.get $compare-ints))))
			(if (call $Vect.is-nat   (local.get $vect1)) (then (return_call_ref $i64.relop (call $Vect.int-to-nat   (local.get $vect0)) (call $Vect.as-nat   (local.get $vect1)) (local.get $compare-nats))))
			(if (call $Vect.is-float (local.get $vect1)) (then (return_call_ref $f64.relop (call $Vect.int-to-float (local.get $vect0)) (call $Vect.as-float (local.get $vect1)) (local.get $compare-floats))))
			(unreachable)
		)
	)
	(if
		(call $Vect.is-nat (local.get $vect0))
		(then
			(if (call $Vect.is-int   (local.get $vect1)) (then (return_call_ref $i64.relop (call $Vect.as-nat       (local.get $vect0)) (call $Vect.int-to-nat (local.get $vect1)) (local.get $compare-nats))))
			(if (call $Vect.is-nat   (local.get $vect1)) (then (return_call_ref $i64.relop (call $Vect.as-nat       (local.get $vect0)) (call $Vect.as-nat     (local.get $vect1)) (local.get $compare-nats))))
			(if (call $Vect.is-float (local.get $vect1)) (then (return_call_ref $f64.relop (call $Vect.nat-to-float (local.get $vect0)) (call $Vect.as-float   (local.get $vect1)) (local.get $compare-floats))))
			(unreachable)
		)
	)
	(if
		(call $Vect.is-float (local.get $vect0))
		(then
			(if (call $Vect.is-int   (local.get $vect1)) (then (return_call_ref $f64.relop (call $Vect.as-float (local.get $vect0)) (call $Vect.int-to-float (local.get $vect1)) (local.get $compare-floats))))
			(if (call $Vect.is-nat   (local.get $vect1)) (then (return_call_ref $f64.relop (call $Vect.as-float (local.get $vect0)) (call $Vect.nat-to-float (local.get $vect1)) (local.get $compare-floats))))
			(if (call $Vect.is-float (local.get $vect1)) (then (return_call_ref $f64.relop (call $Vect.as-float (local.get $vect0)) (call $Vect.as-float     (local.get $vect1)) (local.get $compare-floats))))
			(unreachable)
		)
	)
	(unreachable)
)
