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



;; wraps opcodes so they can be referenced dynamically
(type $i64.relop (func (param i64 i64) (result i32)))
(type $f64.relop (func (param f64 f64) (result i32)))
(func $i64.eq   (type $i64.relop) (i64.eq   (local.get 0) (local.get 1)))
(func $i64.lt_s (type $i64.relop) (i64.lt_s (local.get 0) (local.get 1)))
(func $i64.gt_s (type $i64.relop) (i64.gt_s (local.get 0) (local.get 1)))
(func $i64.le_s (type $i64.relop) (i64.le_s (local.get 0) (local.get 1)))
(func $i64.ge_s (type $i64.relop) (i64.ge_s (local.get 0) (local.get 1)))
(func $i64.lt_u (type $i64.relop) (i64.lt_u (local.get 0) (local.get 1)))
(func $i64.gt_u (type $i64.relop) (i64.gt_u (local.get 0) (local.get 1)))
(func $i64.le_u (type $i64.relop) (i64.le_u (local.get 0) (local.get 1)))
(func $i64.ge_u (type $i64.relop) (i64.ge_u (local.get 0) (local.get 1)))
(func $f64.eq   (type $f64.relop) (f64.eq   (local.get 0) (local.get 1)))
(func $f64.lt   (type $f64.relop) (f64.lt   (local.get 0) (local.get 1)))
(func $f64.gt   (type $f64.relop) (f64.gt   (local.get 0) (local.get 1)))
(func $f64.le   (type $f64.relop) (f64.le   (local.get 0) (local.get 1)))
(func $f64.ge   (type $f64.relop) (f64.ge   (local.get 0) (local.get 1)))
