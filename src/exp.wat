;; # Exponent Operator for Integers
;; Relies upon the fact that
;; ```
;; x ^ y
;; 	:=     (x^2) ^ (y / 2)       if y is even
;; 	:= x * (x^2) ^ ((y - 1) / 2) if y is odd
;; ```
;; ```
;; function exp(base, exponent) {
;; 	return (
;; 		(exponent <   0) ? 0 :
;; 		(exponent === 0) ? 1 :
;; 		(exponent === 1) ? base :
;; 		(exponent === 2) ? base * base :
;; 		(exponent % 2 === 0)
;; 			?        exp(base * base,  exponent      / 2)
;; 			: base * exp(base * base, (exponent - 1) / 2)
;; 	)
;; }
;; ```
(func $exp (param $p0 i32) (param $p1 i32) (result i32)
	local.get $p1
	i32.const 0
	i32.lt_s
	if (result i32) ;; if $p1 < 0
		i32.const 0 ;; return 0
	else
		local.get $p1
		i32.eqz
		if (result i32) ;; else if $p1 === 0
			i32.const 1 ;; return 1
		else
			local.get $p1
			i32.const 1
			i32.eq
			if (result i32) ;; else if $p1 === 1
				local.get $p0 ;; return $p0
			else
				local.get $p1
				i32.const 2
				i32.eq
				if (result i32) ;; else if $p1 === 2
					local.get $p0
					local.get $p0
					i32.mul ;; return $p0 * $p0
				else
					local.get $p1
					i32.ctz
					if (result i32) ;; else if $p1 % 2 === 0
						local.get $p0
						local.get $p0
						i32.mul
						local.get $p1
						i32.const 2
						i32.div_s
						call $exp ;; return $exp($p0 * $p0, $p1 / 2)
					else ;; else (assert $p1 % 2 === 1)
						local.get $p0
						local.get $p0
						local.get $p0
						i32.mul
						local.get $p1
						i32.const 1
						i32.sub
						i32.const 2
						i32.div_s
						call $exp
						i32.mul ;; return $p0 * $exp($p0 * $p0, ($p1 - 1) / 2)
					end
				end
			end
		end
	end
)
