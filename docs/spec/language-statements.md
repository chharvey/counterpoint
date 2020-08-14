# Solid Language: Statements
This chapter defines the syntax, semantics, and behavior of statements in the Solid programming language.


### Runtime Instructions: Build (Statements)
```
Sequence<Instruction> Build(SemanticStatementExpression stmt) :=
	1. *Let* `sequence` be an empty sequence of `Instruction`s.
	2. *If* `stmt.children.count` is greater than 0:
		1. *Set* `sequence` to the result of performing `TryAssessAndBuild(stmt.children.0)`.
	3. *Return* `sequence`.
```



## Variable Declaration


### Runtime Instructions: Build (Variable Declaration)
```
Sequence<Instruction> Build(SemanticDeclaration decl) :=
	/* TO BE DETERMINED */
```



## Variable Assignment


### Runtime Instructions: Build (Variable Assignment)
```
Sequence<Instruction> Build(SemanticAssignment assign) :=
	/* TO BE DETERMINED */
```
