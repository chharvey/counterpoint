;; Returns whether a composite object is “empty” —
;; whether it contains zero entries.
(func $cemp (param $composite (ref eq)) (result i32)
	(if (ref.test (ref $Tuple)  (local.get $composite)) (then (return (i32.eqz (array.len              (ref.cast (ref $Tuple)  (local.get $composite)))))))
	(if (ref.test (ref $Record) (local.get $composite)) (then (return (i32.eqz (array.len              (ref.cast (ref $Record) (local.get $composite)))))))
	(if (ref.test (ref $List)   (local.get $composite)) (then (return (i32.eqz (struct.get $List $size (ref.cast (ref $List)   (local.get $composite)))))))
	(if (ref.test (ref $Dict)   (local.get $composite)) (then (return (i32.eqz (struct.get $Dict $size (ref.cast (ref $Dict)   (local.get $composite)))))))
	(if (ref.test (ref $Map)    (local.get $composite)) (then (return (i32.eqz (struct.get $Map  $size (ref.cast (ref $Map)    (local.get $composite)))))))
	(unreachable)
)
