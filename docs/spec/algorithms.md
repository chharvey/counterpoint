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
	/* TO BE DETERMINED */

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
Type TypeOf(SemanticOperation[operator: COND] expr) :=
	1. *Assert:* `expr.children.count` is 3.
	2. *Let* `t0` be `TypeOf(expr.children.0)`.
	3. *Let* `t1` be `TypeOf(expr.children.1)`.
	4. *Let* `t2` be `TypeOf(expr.children.2)`.
	5. *If* `TypeOf(t0)` is `Boolean`:
		1. *Return:* `TypeUnion(t1, t2)`.
	6. *Throw:* TypeError "Invalid operation.".
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
