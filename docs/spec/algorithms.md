# Abstract Algorithms
This chapter lists and defines common abstract algorithms used throughout this specification.



## Abstract Operation: TypeOf
The abstract algorithm **TypeOf** returns the [Solid Language Type](./data-types.md#solid-language-types)
of an expression.
```
Type TypeOf(SemanticConstant constant) :=
	1. *If* `constant.value` is `null`:
		1. *Return:* `Null`.
	2. *If* `constant.value` is `false` or `true`:
		1. *Return:* `Boolean`.
	3. *If* `constant.value` is a `Integer`:
		1. *Return:* `Integer`.
	4. *If* `constant.value` is a `Float`:
		1. *Return:* `Float`.
	4. Else:
		1. *Assert:* `constant.value` is a `Sequence<RealNumber>`.
		2. *Return:* `String`.

Type TypeOf(StringTemplate template) :=
	1. *Return:* `String`.

Type TypeOf(SemanticIdentifier id) :=
	// TO BE DETERMINED

Type TypeOf(SemanticOperation[operator: NOT | EMP | LT | LE | GT | GE | IS] expr) :=
	1. *Return:* `Boolean`.
Type TypeOf(SemanticOperation[operator: AFF | NEG] expr) :=
	1. *Assert:* `expr.children.count` is 1.
	2. *Let* `t0` be `TypeOf(expr.children.0)`.
	3. *If* `IsNumeric(t0)`:
		1. *Return:* `t0`.
	4. *Throw:* TypeError "Invalid operation.".
Type TypeOf(SemanticOperation[operator: EXP | MUL | DIV | ADD | SUB] expr) :=
	1. *Assert:* `expr.children.count` is 2.
	2. *Let* `t0` be `TypeOf(expr.children.0)`.
	3. *Let* `t1` be `TypeOf(expr.children.1)`.
	4. *If* `IsNumeric(t0)` *and* `IsNumeric(t1)`:
		1. *If* `t0` is `Float` *or* `t1` is `Float`:
			1. *Return:* `Float`.
		2. *Else*:
			1. *Return:* `Integer`.
	5. *Throw:* TypeError "Invalid operation.".
Type TypeOf(SemanticOperation[operator: AND] expr) :=
	1. *Assert:* `expr.children.count` is 2.
	2. *Let* `t0` be `TypeOf(expr.children.0)`.
	3. *If* `t0` is `Null`:
		1. *Return:* `t0`.
	// 4. *If* `t0` is `ToType(false)`:
	// 	1. *Return:* `t0`.
	5. *Let* `t1` be `TypeOf(expr.children.1)`.
	// 6. *If* `t0` is a type union containing `Null`, `ToType(false)`, or `Boolean`:
	// 	1. *Note:* The left-hand operand is either “falsy” or “truthy”;
	// 		if “falsy”, then it will be produced;
	// 		if “truthy”, then the right-hand operand will be produced.
	// 	2. *Return:* `TypeUnion(FalsifyType(t0), t1)`.
	// 7. *Note:* The left-hand operand is definitely “truthy”, thus
	// 	the right-hand operand will definitely be produced.
	// 8. *Return:* `t1`.
	9. *Return:* `TypeUnion(t0, t1)`.
Type TypeOf(SemanticOperation[operator: OR] expr) :=
	1. *Assert:* `expr.children.count` is 2.
	2. *Let* `t0` be `TypeOf(expr.children.0)`.
	3. *Let* `t1` be `TypeOf(expr.children.1)`.
	4. *If* `t0` is `Null`:
		1. *Return:* `t1`.
	// 5. *If* `t0` is `ToType(false)`:
	// 	1. *Return:* `t1`.
	// 6. *If* `t0` is a type union containing `Null`, `ToType(false)`, or `Boolean`:
	// 	1. *Note:* The left-hand operand is either “falsy” or “truthy”;
	// 		if “falsy”, then the right-hand operand will be produced;
	// 		if “truthy”, then it will be produced.
	// 	2. *Return:* `TypeUnion(TruthifyType(t0), t1)`.
	// 7. *Note:* The left-hand operand is definitely “truthy”, thus
	// 	the left-hand operand will definitely be produced.
	// 8. *Return:* `t0`.
	9. *Return:* `TypeUnion(t0, t1)`.
Type TypeOf(SemanticOperation[operator: COND] expr) :=
	1. *Assert:* `expr.children.count` is 3.
	2. *Let* `t0` be `TypeOf(expr.children.0)`.
	3. *Let* `t1` be `TypeOf(expr.children.1)`.
	4. *Let* `t2` be `TypeOf(expr.children.2)`.
	5. *If* `TypeOf(t0)` is `Boolean`:
		1. *Return:* `TypeUnion(t1, t2)`.
	6. *Throw:* TypeError "Invalid operation.".
```



## Abstract Operation: FalsifyType
The `FalsifyType` operation extracts the “falsy” types from a type and returns them.
```
Type FalsifyType(Type t) :=
	1. *If* `t` is `Null`:
		1. *Return:* `Null`.
	2. *If* `t` is `Boolean`:
		1. *Return:* `ToType(false)`.
	3. *If* `t` is a type union of `Null` and another type `s`:
		1. *Return:* `TypeUnion(Null, FalsifyType(s))`.
	4. *If* `t` is a type union of `Boolean` and another type `s`:
		1. *Return:* `TypeUnion(ToType(false), FalsifyType(s))`.
	5. *Return:* `None`.
```



## Abstract Operation: TruthifyType
The `TruthifyType` operation extracts the “truthy” types from a type and returns them.
```
Type TruthifyType(Type t) :=
	1. *If* `t` is `Null`:
		1. *Return:* `Never`.
	2. *If* `t` is `Boolean`:
		1. *Return:* `ToType(true)`.
	3. *If* `t` is a type union of `Null` and another type `s`:
		1. *Return:* `TruthifyType(s)`.
	4. *If* `t` is a type union of `Boolean` and another type `s`:
		1. *Return:* `TypeUnion(ToType(true), TruthifyType(s))`.
	5. *Return:* `t`.
```



## Abstract Operation: IsNumeric
The `IsNumeric` operation determines whether Solid Language Value is of a numeric type,
that is, either an [Integer](./data-types.md#integer) or a [Float](./data-types.md#float).
```
Boolean IsNumeric(Type t) :=
	1. *If* `t` is `Integer` *or* `t` is `Float`:
		1. *Return*: `true`.
	2. *Return*: `false`.
```



## TypeCheck
The **TypeCheck** algorithm performs the type-checking piece during semantic analysis.
```
Void TypeCheck(SemanticExpression expr) :=
	1. *Perform:* `TypeOf(expr)`.
		1. *Note:* The result of this step is not used; it is only performed to rethrow any TypeErrors.

Void TypeCheck(SemanticStatementExpression stmt) :=
	1. *If* `stmt.children.count` is greater than 0:
		1. *Return:* `TypeCheck(stmt.children.0)`.

Void TypeCheck(SemanticGoal goal) :=
	1. For each `SemanticStatment stmt` in `goal.children`:
		1. *Perform:* `TypeCheck(stmt)`.
```



## ToBoolean
The **ToBoolean** algorithm returns an associated [boolean value](./data-types#boolean),
`true` or `false`, with a Solid Language Value.
```
Boolean ToBoolean(SolidLanguageValue value) :=
	1. *If* `TypeOf(value)` is `Null`:
		1. *Return:* `false`.
	2. *If* `TypeOf(value)` is `Boolean`:
		1. *Return:* `value`.
	3. *Return*: `true`.
```
