(global $Vect.VOID                        v128 (v128.const i16x8 0 0 0 0x0000 0 0 0 0))
(global $Vect.NULL  (export "Vect#NULL")  v128 (v128.const i16x8 0 0 0 0x0001 0 0 0 0))
(global $Vect.FALSE (export "Vect#FALSE") v128 (v128.const i16x8 0 0 0 0x0002 0 0 0 0))
(global $Vect.TRUE  (export "Vect#TRUE")  v128 (v128.const i16x8 0 0 0 0x0003 0 0 0 0))



(func $Vect.new-int (param $int i64) (result v128)
	(i64x2.replace_lane 1
		(i16x8.replace_lane 3
			(global.get $Vect.VOID)
			(i32.const 0x18)
		)
		(local.get $int)
	)
)
(func $Vect.new-nat (param $nat i64) (result v128)
	(i64x2.replace_lane 1
		(i16x8.replace_lane 3
			(global.get $Vect.VOID)
			(i32.const 0x28)
		)
		(local.get $nat)
	)
)
(func $Vect.new-float (param $float f64) (result v128)
	(f64x2.replace_lane 1
		(i16x8.replace_lane 3
			(global.get $Vect.VOID)
			(i32.const 0x48)
		)
		(local.get $float)
	)
)



(func $Vect.type (param $vect v128) (result i32)
	(i16x8.extract_lane_u 3 (local.get $vect))
)



(func $Vect.is-void  (param $vect v128) (result i32) (i32.eq (call $Vect.type (local.get $vect)) (i32.const 0x0000)))
(func $Vect.is-null  (param $vect v128) (result i32) (i32.eq (call $Vect.type (local.get $vect)) (i32.const 0x0001)))
(func $Vect.is-false (param $vect v128) (result i32) (i32.eq (call $Vect.type (local.get $vect)) (i32.const 0x0002)))
(func $Vect.is-true  (param $vect v128) (result i32) (i32.eq (call $Vect.type (local.get $vect)) (i32.const 0x0003)))



(func $Vect.is-special (param $vect v128) (result i32) (call $!Vect.check-type-range (local.get $vect) (i32.const 0x0001) (i32.const 0x000f)))
(func $Vect.is-int     (param $vect v128) (result i32) (call $!Vect.check-type-range (local.get $vect) (i32.const 0x0010) (i32.const 0x001f)))
(func $Vect.is-nat     (param $vect v128) (result i32) (call $!Vect.check-type-range (local.get $vect) (i32.const 0x0020) (i32.const 0x002f)))
(func $Vect.is-float   (param $vect v128) (result i32) (call $!Vect.check-type-range (local.get $vect) (i32.const 0x0040) (i32.const 0x004f)))

(func $!Vect.check-type-range (param $vect v128) (param $min i32) (param $max i32) (result i32)
	(local $type i32)
	(local.set $type (call $Vect.type (local.get $vect)))
	(i32.and
		(i32.le_u (local.get $min) (local.get $type))
		(i32.le_u (local.get $type) (local.get $max))
	)
)



(func $Vect.as-int   (param $vect v128) (result i64) (i64x2.extract_lane 1 (local.get $vect)))
(func $Vect.as-nat   (param $vect v128) (result i64) (i64x2.extract_lane 1 (local.get $vect)))
(func $Vect.as-float (param $vect v128) (result f64) (f64x2.extract_lane 1 (local.get $vect)))



(func $Vect.int-to-nat   (param $vect v128) (result i64) (call $Vect.as-nat (local.get $vect))) ;; reinterpretation doesn’t change the bits
(func $Vect.int-to-float (param $vect v128) (result f64) (f64.convert_i64_s (call $Vect.as-int (local.get $vect))))
(func $Vect.nat-to-int   (param $vect v128) (result i64) (call $Vect.as-int (local.get $vect))) ;; reinterpretation doesn’t change the bits
(func $Vect.nat-to-float (param $vect v128) (result f64) (f64.convert_i64_u (call $Vect.as-nat (local.get $vect))))
(func $Vect.float-to-int (param $vect v128) (result i64) (i64.trunc_sat_f64_s (call $Vect.as-float (local.get $vect))))
(func $Vect.float-to-nat (param $vect v128) (result i64) (i64.trunc_sat_f64_u (call $Vect.as-float (local.get $vect))))
