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
	3. *If* `constant.value` is a `RealNumber`:
		1. *Return:* `Number`.
	4. Else:
		1. *Assert:* `constant.value` is a `Sequence<RealNumber>`.
		2. *Return:* `String`.

Type TypeOf(StringTemplate template) :=
	1. *Return:* `String`.

Type TypeOf(SemanticIdentifier id) :=
	/* TO BE DETERMINED */

Type TypeOf(SemanticOperation operation) :=
	1. *If* `TypeOf(operation.children.0)` is `Number`:
		1. *If* `operation.children.count` is 1:
			1. *Return:* `Number`.
		2. *Else:*
			1. *Assert:* `operation.children.count` is 2.
			2. *If* `TypeOf(operation.children.1)` is `Number`:
				1. *Return:* `Number`.
	2. *Throw:* TypeError "Invalid operation.".
```



## TypeCheck
The **TypeCheck** algorithm performs the type-checking piece during semantic analysis.
```w3c
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
