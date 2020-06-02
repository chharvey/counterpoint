# Solid Language: Goal Symbols
This chapter defines the syntax, semantics, and behavior of goal symbols in the Solid programming language.

```w3c
Goal ::= #x02 Statement* #x03;
```


### Static Semantics: Decorate (Goal Symbols)
```w3c
Decorate(Goal ::= #x02 #x03) -> SemanticNodeGoal
	:= SemanticNodeGoal {} [];
Decorate(Goal ::= #x02 Statement__List #x03) -> SemanticNodeGoal
	:= SemanticNodeGoal {} [
		Decorate(Statement__List),
	];

Decorate(Statement__List ::= Statement) -> SemanticStatementList
	:= SemanticStatementList {} [
		Decorate(Statement),
	];
Decorate(Statement__List ::= Statement__List Statement) -> SemanticStatementList
	:= SemanticStatementList {} [
		...Decorate(Statement__List),
		Decorate(Statement),
	];
```


### Runtime Instructions: Evaluate (Goal Symbols)
```w3c
Sequence<RealNumber> Evaluate(SemanticNodeGoal goal) :=
	1. *Let* `sequence` be an empty sequence of `RealNumber`s.
	2. *If* `goal.children.count` is greater than 0:
		1. *Set* `sequence` to the result of performing `Evaluate(goal.children.0)`.
	3. *Return* `sequence`.

Sequence<RealNumber> Evaluate(SemanticStatementList statements) :=
	1. *Let* `sequence` be an empty sequence of `RealNumber`s.
	2. For each `child` in `statements.children`:
		1. Push the result of performing `Evaluate(child)` to `sequence`.
	3. *Return* `sequence`.
```
