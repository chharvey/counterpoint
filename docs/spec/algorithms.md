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
	1. *If* `value` is an instance of `Null`:
		1. *Return:* `false`.
	2. *If* `value` is an instance of `Boolean`:
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
	4. *If* `a` is an instance of `Integer` *and* `b` is an instance of `Integer`:
		1. *If* `a` and `b` have the same bitwise encoding:
			1. *Return:* `true`.
	5. *If* `a` is an instance of `Float` *and* `b` is an instance of `Float`:
		1. *If* `a` and `b` have the same bitwise encoding:
			1. *Return:* `true`.
	6. *If* `a` is an instance of `String` *and* `b` is an instance of `String`:
		1. *If* `a` and `b` are exactly the same sequence of code units
			(same length and same code units at corresponding indices):
			1. *Return:* `true`.
	7. *If* `a` and `b` are the same object:
		1. *Return:* `true`.
	8. Return `false`.
```



## Equal
Compares two objects and returns whether they are considered “equal” by some definition.
```
Boolean Equal(Object a, Object b) :=
	1. *If* `Identical(a, b)` is `true`:
		1. *Return:* `true`.
	2. *If* `a` is an instance of `Integer` *or* `b` is an instance of `Integer`:
		1. *If* `a` is an instance of `Float` *or* `b` is an instance of `Float`:
			1. *Return:* `Equal(Float(a), Float(b))`.
	3. *If* `a` is an instance of `Float` *and* `b` is an instance of `Float`:
		1. *If* `a` is `0.0` *and* `b` is `-0.0`:
			1. *Return:* `true`.
		2. *If* `a` is `-0.0` *and* `b` is `0.0`:
			1. *Return:* `true`.
	4. *If* `a` is an instance of `Tuple` *and* `b` is an instance of `Tuple`:
		1. *Let* `seq_a` be a new Sequence whose items are exactly the items in `a`.
		2. *Let* `seq_b` be a new Sequence whose items are exactly the items in `b`.
		3. *If* `seq_a.count` is not `seq_b.count`:
			1. *Return:* `false`.
		4. Assume *UnwrapAffirm:* `Equal(a, b)` is `false`, and use this assumption when performing the following step.
			1. *Note:* This assumption prevents an infinite loop,
				if `a` and `b` ever recursively contain themselves or each other.
		5. *For index* `i` in `seq_b`:
			1. *If* *UnwrapAffirm*: `Equal(seq_a[i], seq_b[i])` is `false`:
				1. *Return:* `false`.
		6. *Return:* `true`.
	5. *If* `a` is an instance of `Record` *and* `b` is an instance of `Record`:
		1. *Let* `struct_a` be a new Structure whose properties are exactly the properties in `a`.
		2. *Let* `struct_b` be a new Structure whose properties are exactly the properties in `b`.
		3. *If* `struct_a.count` is not `struct_b.count`:
			1. *Return:* `false`.
		4. Assume *UnwrapAffirm:* `Equal(a, b)` is `false`, and use this assumption when performing the following step.
			1. *Note:* This assumption prevents an infinite loop,
				if `a` and `b` ever recursively contain themselves or each other.
		5. *For key* `k` in `struct_b`:
			1. *If* `struct_a[k]` is not set:
				1. *Return:* `false`.
			2. *If* *UnwrapAffirm*: `Equal(struct_a[k], struct_b[k])` is `false`:
				1. *Return:* `false`.
		6. *Return:* `true`.
	6. *If* `a` is an instance of `Mapping` *and* `b` is an instance of `Mapping`:
		1. *Let* `data_a` be a new Sequence of 2-tuples,
			whose items are exactly the antecedents and consequents in `a`.
		2. *Let* `data_b` be a new Sequence of 2-tuples,
			whose items are exactly the antecedents and consequents in `b`.
		3. *If* `data_a.count` is not `data_b.count`:
			1. *Return:* `false`.
		4. Assume *UnwrapAffirm:* `Equal(a, b)` is `false`, and use this assumption when performing the following step.
			1. *Note:* This assumption prevents an infinite loop,
				if `a` and `b` ever recursively contain themselves or each other.
		5. *For each* `it_b` in `data_b`:
			1. Find an item `it_a` in `data_a` such that *UnwrapAffirm:* `Equal(it_a.0, it_b.0)` is `true`.
			2. *If* no such item `it_a` is found:
				1. *Return:* `false`.
			3. *If* *UnwrapAffirm:* `Equal(it_a.1, it_b.1)` is `false`:
				1. *Return:* `false`.
		6. *Return:* `true`.
	7. Return `false`.
```



## Subtype
Determines whether one type is a subtype of another.
```
Boolean Subtype(Type a, Type b) :=
	1. *If* *UnwrapAffirm:* `Identical(a, b)`:
		// 2-7 | `A <: A`
		1. *Return:* `true`.
	2. *If* *UnwrapAffirm:* `IsEmpty(a)`:
		// 1-1 | `never <: T`
		1. *Return:* `true`.
	3. *If* *UnwrapAffirm:* `IsEmpty(b)`:
		// 1-3 | `T       <: never  <->  T == never`
		1. *Return:* `IsEmpty(a)`.
	4. *If* *UnwrapAffirm:* `IsUniverse(a)`:
		// 1-4 | `unknown <: T      <->  T == unknown`
		1. *Return:* `IsUniverse(b)`.
	5. *If* *UnwrapAffirm:* `IsUniverse(b)`:
		// 1-2 | `T     <: unknown`
		1. *Return:* `true`.
	6. *If* `a` is the intersection of some types `x` and `y`:
		1. *If* *UnwrapAffirm:* `Equal(x, b)` *or* *UnwrapAffirm:* `Equal(y, b)`:
			// 3-1 | `A  & B <: A  &&  A  & B <: B`
			1. *Return:* `true`.
		2. *If* *UnwrapAffirm:* `Subtype(x, b)` *or* *UnwrapAffirm:* `Subtype(y, b)`:
			// 3-8 | `A <: C  \|\|  B <: C  -->  A  & B <: C`
			1. *Return:* `true`.
	7. *If* `b` is the intersection of some types `x` and `y`:
		1. *If* *UnwrapAffirm:* `Subtype(a, x)` *or* *UnwrapAffirm:* `Subtype(a, y)`:
			// 3-5 | `A <: C    &&  A <: D  <->  A <: C  & D`
			1. *Return:* `true`.
	8. *If* `a` is the union of some types `x` and `y`:
		1. *If* *UnwrapAffirm:* `Subtype(x, b)` *or* *UnwrapAffirm:* `Subtype(y, b)`:
			// 3-7 | `A <: C    &&  B <: C  <->  A \| B <: C`
			1. *Return:* `true`.
	9. *If* `b` is the union of some types `x` and `y`:
		1. *If* *UnwrapAffirm:* `Equal(a, x)` *or* *UnwrapAffirm:* `Equal(a, y)`:
			// 3-2 | `A <: A \| B  &&  B <: A \| B`
			1. *Return:* `true`.
		2. *If* *UnwrapAffirm:* `Subtype(a, x)` *or* *UnwrapAffirm:* `Subtype(a, y)`:
			// 3-6 | `A <: C  \|\|  A <: D  -->  A <: C \| D`
			1. *Return:* `true`.
	10. *If* `Equal(a, Tuple)` *and* `Equal(b, Tuple)`:
		1. *Let* `seq_a` be a Sequence whose items are exactly the items in `a`.
		2. *Let* `seq_b` be a Sequence whose items are exactly the items in `b`.
		3. *Let* `seq_a_req` be a filtering of `seq_a` for each `ia` such that `ia.optional` is `false`.
		4. *Let* `seq_b_req` be a filtering of `seq_b` for each `ib` such that `ib.optional` is `false`.
		5. *If* `seq_a_req.count` is less than `seq_b_req.count`:
			1. *Return:* `false`.
		6. *For index* `i` in `seq_b`:
			1. *If* `seq_b[i].optional` is `false`:
				1. *Assert:* `seq_a[i]` is set *and* `seq_a[i].optional` is `false`.
			2. *If* `seq_a[i]` is set *and* *UnwrapAffirm:* `Subtype(seq_a[i].type, seq_b[i].type)` is `false`:
				1. *Return:* `false`.
		7. *Return:* `true`.
	11. *If* `Equal(a, Record)` *and* `Equal(b, Record)`:
		1. *Let* `struct_a` be a Structure whose properties are exactly the properties in `a`.
		2. *Let* `struct_b` be a Structure whose properties are exactly the properties in `b`.
		3. *Let* `struct_a_req` be a filtering of `struct_a`’s values for each `va` such that `va.optional` is `false`.
		4. *Let* `struct_b_req` be a filtering of `struct_b`’s values for each `vb` such that `vb.optional` is `false`.
		5. *If* `struct_a_req.count` is less than `struct_b_req.count`:
			1. *Return:* `false`.
		6. *For key* `k` in `struct_b`:
			1. *If* `struct_b[k].optional` is `false`:
				1. *If* `struct_a[k]` is not set *or* `struct_a[k].optional` is `true`:
					1. *Return:* `false`.
			2. *If* `struct_a[k]` is set *and* *UnwrapAffirm:* `Subtype(struct_a[k].type, struct_b[k].type)` is `false`:
				1. *Return:* `false`.
		7. *Return:* `true`.
	12. *If* `Equal(a, Mapping)` *and* `Equal(b, Mapping)`:
		1. *Let* `ak` be the union of antecedent types in `a`.
		2. *Let* `av` be the union of consequent types in `a`.
		3. *Let* `bk` be the union of antecedent types in `b`.
		4. *Let* `bv` be the union of consequent types in `b`.
		5. *If* *UnwrapAffirm:* `Subtype(ak, bk)` is `true` *and* *UnwrapAffirm:* `Subtype(av, bv)` is `true`:
			1. *Return:* `true`.
	13. *If* every value that is assignable to `a` is also assignable to `b`:
		1. *Note:* This covers all subtypes of `Object`, e.g., `Subtype(Integer, Object)` returns true
			because an instance of `Integer` is an instance of `Object`.
		2. *Return:* `true`.
	14. *Return:* `false`.
;
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


## CombineTuplesOrRecords
Combines an intersection or union of tuples or records for the purposes of type-checking index/property access.
```
Type CombineTuplesOrRecords(Type t) :=
	1. *If* `t` is the intersection of some types `a` and `b`:
		1. *If* `Subtype(a, Tuple)` *and* `Subtype(b, Tuple)`:
			1. *Let* `seq_a` be a Sequence whose items are exactly the items in `a`.
			2. *Let* `seq_b` be a Sequence whose items are exactly the items in `b`.
			3. *Let* `data` be a copy of `seq_a`.
			4. *For index* `i` in `seq_b`:
				1. *If* `data[i]` is set:
					1. *If* `data[i].optional` is `true` *and* `seq_b[i].optional` is `true`:
						1. *Let* `optional` be `true`.
					2. *Else:*
						1. *Let* `optional` be `false`.
					3. *Set* `data[i]` to a new Structure [
						type=     *UnwrapAffirm:* `Intersect(data[i].type, seq_b[i].type)`,
						optional= optional,
					].
				2. *Else:*
					1. *Set* `data[i]` to `seq_b[i]`.
			5. *Assert:* In `data`, all optional items follow all required items.
			6. *Return:* a subtype of `Tuple` whose items are `data`.
		2. *If* `Subtype(a, Record)` *and* `Subtype(b, Record)`:
			1. *Let* `struct_a` be a Structure whose properties are exactly the properties in `a`.
			2. *Let* `struct_b` be a Structure whose properties are exactly the properties in `b`.
			3. *Let* `data` be a copy of `struct_a`.
			4. *For key* `k` in `struct_b`:
				1. *If* `data[k]` is set:
					1. *If* `data[k].optional` is `true` *and* `struct_b[k].optional` is `true`:
						1. *Let* `optional` be `true`.
					2. *Else:*
						1. *Let* `optional` be `false`.
					3. *Set* `data[k]` to a new Structure [
						type=     *UnwrapAffirm:* `Intersect(data[k].type, struct_b[k].type)`,
						optional= optional,
					].
				2. *Else:*
					1. *Set* `data[k]` to `struct_b[k]`.
			5. *Return:* a subtype of `Record` whose properties are `data`.
	2. *If* `t` is the union of some types `a` and `b`:
		1. *If* `Subtype(a, Tuple)` *and* `Subtype(b, Tuple)`:
			1. *Let* `seq_a` be a Sequence whose items are exactly the items in `a`.
			2. *Let* `seq_b` be a Sequence whose items are exactly the items in `b`.
			3. *Let* `data` be a new Sequence.
			4. *For index* `i` in `seq_b`:
				1. *If* `seq_a[i]` is set:
					1. *If* `seq_a[i].optional` is `true` *or* `seq_b[i].optional` is `true`:
						1. *Let* `optional` be `true`.
					2. *Else:*
						1. *Let* `optional` be `false`.
					3. *Set* `data[i]` to a new Structure [
						type=     *UnwrapAffirm:* `Union(seq_a[i].type, seq_b[i].type)`,
						optional= optional,
					].
			5. *Assert:* In `data`, all optional items follow all required items.
			6. *Return:* a subtype of `Tuple` whose items are `data`.
		2. *If* `Subtype(a, Record)` *and* `Subtype(b, Record)`:
			1. *Let* `struct_a` be a Structure whose properties are exactly the properties in `a`.
			2. *Let* `struct_b` be a Structure whose properties are exactly the properties in `b`.
			3. *Let* `data` be a new Structure.
			4. *For key* `k` in `struct_b`:
				1. *If* `struct_a[k]` is set:
					1. *If* `struct_a[k].optional` is `true` *or* `struct_b[k].optional` is `true`:
						1. *Let* `optional` be `true`.
					2. *Else:*
						1. *Let* `optional` be `false`.
					3. *Set* `data[k]` to a new Structure [
						type=     *UnwrapAffirm:* `Union(struct_a[k].type, struct_b[k].type)`,
						optional= optional,
					].
			5. *Return:* a subtype of `Record` whose properties are `data`.
	3. *Return:* `t`.
;
```


## MaybeOptional
Returns an entry’s type if it is required; unions with Void if it is optional.
```
Type MaybeOptional(EntryTypeStructure entry) :=
	1. *Let* `type` be `entry.type`.
	2. *If*: `entry.optional` is `true`:
		1. *If*: `access.optional` is `true`:
			1. *Return:* `Union(type, Null)`.
		2. *Return:* `Union(type, Void)`.
	3. *Return:* `type`.
;
```
