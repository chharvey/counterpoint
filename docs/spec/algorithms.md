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
whereas a code unit is the [UTF-16-encoded](#utf16encoding) value of that code point.
```
CodePoint([#x00-#x10ffff]) -> RealNumber
	:=; // TO BE DESCRIBED
```



## UTF16Encoding
Encodes a code point using the UTF-16 encoding algorithm.
A code unit is a [real integer number](./data-types.md#real-integer-numbers)
representing one character or part of a character in a [string](./data-types.md#string).
In the UTF-16 encoding, characters in the Unicode character set
are represented by either one or two code units.
```
Sequence<RealNumber> UTF16Encoding(RealNumber n) :=
	1. *If* `n` is less than 0 or greater than \x10ffff:
		1. *Throw:* a LexError.
	2. *If* `n` is less than or equal to \xffff:
		1. *Return:* [n].
	3. *Let* `d` be `n - \x10000`.
	4. *Let* `cu1` be the integer quotient of `d / \x400`.
	5. *Let* `cu2` be the integer remainder of `d / \x400`.
	6. *Return:* [cu1 + \xd800, cu2 + \xdc00].
```



## VarCheck
Performs the definite assignment piece during semantic analysis.
```
Void VarCheck(Or<SemanticType, SemanticConstant> node) :=
	1. *Return.*
;

Void! VarCheck(SemanticIdentifier id) :=
	1. *If* the validator does not contain a record for `id`:
		1. *Throw:* a new ReferenceError01.
	// TODO: Throw a ReferenceError02 if the variable is declared further down in source.
;

Void! VarCheck(Or<SemanticTemplate, SemanticOperation, SemanticStatementExpression, SemanticAssignment, SemanticGoal> list) :=
	1. *For* `i` in `list`:
		1. Perform *Unwrap:* `VarCheck(list[i])`.
;

Void! VarCheck(SemanticDeclarationVariable decl) :=
	1. *Assert:* `decl.children.count` is 3.
	2. *Let* `assignee` be `decl.children.0`.
	3. *Assert:* `assignee.children.count` is 1.
	4. *Let* `id` be `assignee.children.0`.
	5. *If* the validator contains a record for `id`:
		1. *Throw:* a new AssignmentError01.
	6. Add a record for `id` to the validator. // TODO: to be specified
	7. *Return:* `VarCheck(decl.children.2)`.
;

Void! VarCheck(SemanticAssignee assignee) :=
	1. *Assert:* `assignee.children.count` is 1.
	2. *Let* `id` be `assignee.children.0`.
	3. Perform *Unwrap:* `VarCheck(id)`.
	4. *Assert:* The validator contains a record for `id`.
	5. *Let* `info` be the record for `id` in the validator.
	6. *If* `info.unfixed` is `false`:
		1. *Throw:* a new AssignmentError10.
;
```



## TypeCheck
Performs the type-checking piece during semantic analysis.
```
Void TypeCheck(SemanticType type) :=
	1. *Return*. // NOTE: all SemanticType nodes are valid for now

Void! TypeCheck(SemanticExpression expr) :=
	1. *Perform:* *Unwrap:* `TypeOf(expr)`.
		1. *Note:* The result of this step is not used; it is only performed to rethrow any TypeErrors.

Void! TypeCheck(SemanticStatementExpression stmt) :=
	1. *If* `stmt.children.count` is greater than 0:
		1. *Return:* `TypeCheck(stmt.children.0)`.

Void! TypeCheck(SemanticDeclarationVariable stmt) :=
	1. *Assert:* `stmt.children.count` is 3.
	2. *Let* `assignee_type` be *UnwrapAffirm:* `Assess(stmt.children.1)`.
	3. *Let* `assigned_type` be *Unwrap:* `TypeOf(stmt.children.2)`.
	4. *If* `assigned_type` is not a subtype of `assignee_type`:
		1. *Throw:* a new TypeError03.

Void! TypeCheck(SemanticAssignment stmt) :=
	1. *Assert:* `stmt.children.count` is 2.
	2. *Let* `assignee` be `stmt.children.0`.
	3. *Assert:* `assignee.children.count` is 1.
	4. *Let* `assignee_type` be *Unwrap:* `TypeOf(assignee.children.0)`.
	5. *Let* `assigned_type` be *Unwrap:* `TypeOf(stmt.children.2)`.
	6. *If* `assigned_type` is not a subtype of `assignee_type`:
		1. *Throw:* a new TypeError03.

Void! TypeCheck(SemanticAssignee assignee) :=
	1. *Return:* `TypeCheck(assignee.children.0)`.

Void! TypeCheck(SemanticGoal goal) :=
	1. For each `SemanticStatment stmt` in `goal.children`:
		1. *Perform:* `TypeCheck(stmt)`.
```



## ToBoolean
Returns an associated [boolean value](./data-types#boolean), `true` or `false`, with a Solid Language Value.
```
Boolean ToBoolean(Object value) :=
	1. *If* `TypeOf(value)` is `Null`:
		1. *Return:* `false`.
	2. *If* `TypeOf(value)` is `Boolean`:
		1. *Return:* `value`.
	3. *Return*: `true`.
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
