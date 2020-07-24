# Abstract Algorithms
This chapter lists and defines common abstract algorithms used throughout this specification.



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
