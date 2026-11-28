(func $Closure.call (export "Closure#call")
	(param $closure (ref $Closure))
	(param $env     (ref $Tuple))
	(param $args    (ref null $Tuple))
	(result (ref null $Value) (ref null $Exception))

	(call_ref $Signature
		(local.get $env)
		(local.get $args)
		(struct.get $Closure $func (local.get $closure))
	)
)
