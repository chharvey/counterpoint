# Abstract Algorithms
This chapter lists and defines common abstract algorithms used throughout this specification.



## DigitCount
The **DigitCount** attribute grammar gives the [number](./data-types.md#real-integer-numbers) of
numeric (non-separator) digits in a digit sequence.
```
DigitCount(DigitSequenceDec :::= [0-9]) -> RealNumber
	:= 1;
DigitCount(DigitSequenceDec :::= DigitSequenceDec "_"? [0-9]) -> RealNumber
	:= DigitCount(DigitSequenceDec) + DigitCount([0-9]);
```



## CodePoint
The **CodePoint** of a character is the integer index of its placement in the Unicode character set.
A code point is *not* a code unit. A code point is simply Unicode’s index of a character,
whereas a code unit is the [UTF-8-encoded](#utf8encoding) value of that code point.
```
CodePoint([#x00-#x10ffff]) -> RealNumber
	:=; // TO BE DESCRIBED
```



## UTF8Encoding
Encodes a code point using the UTF-8 encoding algorithm.
In the UTF-8 encoding, characters in the Unicode character set
are represented by one to four code units
(but UTF-8 supports up to six code units for higher code points).
```
Sequence<RealNumber> Divide(RealNumber n, RealNumber count) :=
	1. *Assert:* `n` is greater than \x7f.
	2. *If* `count` is less than or equal to 1:
		1. *Return:* [`n`].
	3. *Assert:* `count` is greater than 1.
	4. *Let* `remainder` be the integer remainder of `n` / \x40.
	5. *Let* `quotient`  be the integer quotient  of `n` / \x40.
	6. *Else:*
		1. *Return:* [
			...*UnwrapAffirm:* `Divide(quotient, count - 1)`,
			`remainder`,
		].
;
Sequence<RealNumber> UTF8Encoding(RealNumber n) :=
	1. *If* `n` is less than 0:
		1. *Throw:* a new LexError.
	2. *If* `n` is less than or equal to \x7f:
		1. *Return:* [`n`].
	3. *If* `n` is less than or equal to \x7ff:
		1. *Let* `codeunits` be *UnwrapAffirm:* `Divide(n, 2)`.
		2. *Assert:* `codeunits.count` is 2.
		3. *Return:* [
			\xc0 + `codeunits.0`,
			\x80 + `codeunits.1`,
		].
	4. *If* `n` is less than or equal to \xffff:
		1. *Let* `codeunits` be *UnwrapAffirm:* `Divide(n, 3)`.
		2. *Assert:* `codeunits.count` is 3.
		3. *Return:* [
			\xe0 + `codeunits.0`,
			\x80 + `codeunits.1`,
			\x80 + `codeunits.2`,
		].
	5. *If* `n` is less than or equal to \x1f_ffff:
		1. *Let* `codeunits` be *UnwrapAffirm:* `Divide(n, 4)`.
		2. *Assert:* `codeunits.count` is 4.
		3. *Return:* [
			\xf0 + `codeunits.0`,
			\x80 + `codeunits.1`,
			\x80 + `codeunits.2`,
			\x80 + `codeunits.3`,
		].
	6. *If* `n` is less than or equal to \x3ff_ffff:
		1. *Let* `codeunits` be *UnwrapAffirm:* `Divide(n, 5)`.
		2. *Assert:* `codeunits.count` is 5.
		3. *Return:* [
			\xf8 + `codeunits.0`,
			\x80 + `codeunits.1`,
			\x80 + `codeunits.2`,
			\x80 + `codeunits.3`,
			\x80 + `codeunits.4`,
		].
	7. *If* `n` is less than or equal to \x7fff_ffff:
		1. *Let* `codeunits` be *UnwrapAffirm:* `Divide(n, 6)`.
		2. *Assert:* `codeunits.count` is 6.
		3. *Return:* [
			\xfc + `codeunits.0`,
			\x80 + `codeunits.1`,
			\x80 + `codeunits.2`,
			\x80 + `codeunits.3`,
			\x80 + `codeunits.4`,
			\x80 + `codeunits.5`,
		].
	8. *Throw:* a new LexError.
;
```



## UTF8Decoding
Decodes a sequence of code units into a sequence of code points using the UTF-8 decoding algorithm.
```
RealNumber Multiply(Sequence<RealNumber> ns) :=
	1. *If* `ns.count` is 0:
		1. *Return:* 0.
	2. Return *UnwrapAffirm:* `Multiply(ns[0, -1])` * \x40 + `ns.lastItem`.
;
Void! Continue(Sequence<RealNumber> units) :=
	1. *For index* `i` in `units`:
		1. *If* `i` is 0:
			1. *Continue.*
		2. *If* `units[i]` is less than \x80 or greater than or equal to \xc0:
			1. *Note:* The bits of `units[i]` are either "0_______" or "11______".
			2. *Throw:* `i`.
		3. *Note:* The bits of `units[i]` are "10______".
	2. *Return.*
;
RealNumber! UTF8Decoding(Sequence<RealNumber> codeunits) :=
	1. *Assert:* `codeunits.count` is 1, 2, 3, 4, 5, or 6:
	2. *If* `codeunits.0` is less than 0:
		1. *Return:* \xfffd. // U+FFFD REPLACEMENT CHARACTER
	3. *If* `codeunits.0` is less than \x80:
		1. *Note:* The bits of `codeunits.0` are "0_______".
		2. *Return:* `codeunits.0`.
	4. *If* `codeunits.0` is less than \xc0:
		1. *Note:* The bits of `codeunits.0` are "10______".
		2. *Return:* \xfffd.
	5. *If* `codeunits.0` is less than \xe0:
		1. *Note:* The bits of `codeunits.0` are "110_____".
		2. *Unwrap:* `Continue(codeunits[1, 2])`.
		3. *Return:* `Multiply([
			`codeunits.0` - \xc0,
			`codeunits.1` - \x80,
		])`.
	6. *If* `codeunits.0` is less than \xf0:
		1. *Note:* The bits of `codeunits.0` are "1110____".
		2. *Unwrap:* `Continue(codeunits[1, 3])`.
		3. *Return:* `Multiply([
			`codeunits.0` - \xe0,
			`codeunits.1` - \x80,
			`codeunits.2` - \x80,
		])`.
	7. *If* `codeunits.0` is less than \xf8:
		1. *Note:* The bits of `codeunits.0` are "11110___".
		2. *Unwrap:* `Continue(codeunits[1, 4])`.
		3. *Return:* `Multiply([
			`codeunits.0` - \xf0,
			`codeunits.1` - \x80,
			`codeunits.2` - \x80,
			`codeunits.3` - \x80,
		])`.
	8. *If* `codeunits.0` is less than \xfc:
		1. *Note:* The bits of `codeunits.0` are "111110__".
		2. *Unwrap:* `Continue(codeunits[1, 5])`.
		3. *Return:* `Multiply([
			`codeunits.0` - \xf8,
			`codeunits.1` - \x80,
			`codeunits.2` - \x80,
			`codeunits.3` - \x80,
			`codeunits.4` - \x80,
		])`.
	9. *If* `codeunits.0` is less than \xfe:
		1. *Note:* The bits of `codeunits.0` are "1111110_".
		2. *Unwrap:* `Continue(codeunits[1, 6])`.
		3. *Return:* `Multiply([
			`codeunits.0` - \xfc,
			`codeunits.1` - \x80,
			`codeunits.2` - \x80,
			`codeunits.3` - \x80,
			`codeunits.4` - \x80,
			`codeunits.5` - \x80,
		])`.
	10. *Return:* \xfffd.
;
```



## VarCheck
Performs the definite assignment piece during semantic analysis.



## TypeCheck
Performs the type-checking piece during semantic analysis.



## ToBoolean
Returns an associated [boolean value](./data-types#boolean), `true` or `false`, with a Solid Language Value.
```
Boolean ToBoolean(Object value) :=
	1. *If* `TypeOf(value)` is `Null`:
		1. *Return:* `false`.
	2. *If* `TypeOf(value)` is `Boolean`:
		1. *Return:* `value`.
	3. *Return:* `true`.
```



## Identical
Compares two objects and returns whether they are the exact same object.
```
Boolean Identical(Object a, Object b) :=
	1. *If* `a` is the value `null` and `b` is the value `null`:
		1. *Return:* `true`.
	2. *If* `a` is the value `false` *and* `b` is the value `false`:
		1. *Return:* `true`.
	3. *If* `a` is the value `true` *and* `b` is the value `true`:
		1. *Return:* `true`.
	4. *If* `a` is of type `Integer` *and* `b` is of type `Integer`:
		1. If `a` and `b` have the same bitwise encoding:
			1. *Return:* `true`.
	5. *If* `a` is of type `Float` *and* `b` is of type `Float`:
		1. If `a` and `b` have the same bitwise encoding:
			1. *Return:* `true`.
	// 6. *If* `a` is of type `String` *and* `b` is of type `String`:
	// 	1. If `a` and `b` are exactly the same sequence of code units
	// 		(same length and same code units at corresponding indices):
	// 		1. *Return:* `true`.
	// 7. *If* `a` and `b` are the same object:
	// 	1. *Return:* `true`.
	8. Return `false`.
```



## Equal
Compares two objects and returns whether they are considered “equal” by some definition.
```
Boolean Equal(Object a, Object b) :=
	1. *If* `Identical(a, b)` is `true`:
		1. *Return:* `true`.
	2. *If* `a` is of type `Number` *and* `b` is of type `Number`:
		1. *If* `a` is of type `Float` *or* `b` is of type `Float`:
			1. *Return:* `Equal(Float(a), Float(b))`.
	3. *If* `a` is of type `Float` *and* `b` is of type `Float`:
		1. If `a` is `0.0` *and* `b` is `-0.0`:
			1. *Return:* `true`.
		2. If `a` is `-0.0` *and* `b` is `0.0`:
			1. *Return:* `true`.
	// 3. TODO: custom equality operators
	4. Return `false`.
```



## PerformBinaryArithmetic
Performs a binary arithmetic operation.
```
Number! PerformBinaryArithmetic(Text op, Number operand0, Number operand1) :=
	1. *If* `op` is `EXP`:
		1. *Let* `result` be the power, `operand0 ^ operand1`,
			obtained by raising `operand0` (the base) to `operand1` (the exponent).
		2. *Return:* `result`.
	2. *Else If* `op` is `MUL`:
		1. *Let* `result` be the product, `operand0 * operand1`,
			obtained by multiplying `operand0` (the multiplicand) by `operand1` (the multiplier).
		2. *Return:* `result`.
	3. *Else If* `op` is `DIV`:
		1. *Let* `result` be the quotient, `operand0 / operand1`,
			obtained by dividing `operand0` (the dividend) by `operand1` (the divisor).
		2. *Return:* `result`.
	4. *Else If* `op` is `ADD`:
		1. *Let* `result` be the sum, `operand0 + operand1`,
			obtained by adding `operand0` (the augend) to `operand1` (the addend).
		2. *Return:* `result`.
	5. *Throw:* a new TypeError01.
```



## PerformBinaryCompare
Performs a binary comparison operation.
```
Boolean! PerformBinaryCompare(Text op, Number operand0, Number operand1) :=
	1. *If* `op` is `LT`:
		1. *If* `operand0` is strictly less than `operand1`:
			1. *Return:* `true`.
		2. *Return:* `false`.
	2. *Else If* `op` is `GT`:
		1. *If* `operand1` is strictly less than `operand0`:
			1. *Return:* `true`.
		2. *Return:* `false`.
	3. *Else If* `op` is `LE`:
		1. *If* `operand0` is equal to `operand1`:
			1. *Return:* `true`.
		2. *If* `operand0` is strictly less than `operand1`:
			1. *Return:* `true`.
		3. *Return:* `false`.
	4. *Else If* `op` is `GE`:
		1. *If* `operand0` is equal to `operand1`:
			1. *Return:* `true`.
		2. *If* `operand1` is strictly less than `operand0`:
			1. *Return:* `true`.
		3. *Return:* `false`.
	5. *Throw:* a new TypeError01.
```
