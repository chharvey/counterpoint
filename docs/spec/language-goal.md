# Solid Language: Goal Symbols
This chapter defines the syntax, semantics, and behavior of goal symbols in the Solid programming language.

```
Goal ::= #x02 Statement* #x03;
```


### Static Semantics: Semantic Schema (Goal Symbols)
```
SemanticGoal
	::= SemanticStatement*;
```


### Static Semantics: Decorate (Goal Symbols)
```
Decorate(Goal ::= #x02 #x03) -> SemanticGoal
	:= (SemanticGoal);
Decorate(Goal ::= #x02 Statement__List #x03) -> SemanticGoal
	:= (SemanticGoal Decorate(Statement__List));
```


### Runtime Instructions: Build (Goal Symbols)
```
Sequence<Instruction> Build(SemanticGoal goal) :=
	1. *Let* `sequence` be an empty sequence of `Instruction`s.
	2. For each `SemanticStatment stmt` in `goal.children`:
		1. *Let* `instrs` be the result of performing `Build(stmt)`.
		2. Push `...instrs` to `sequence`.
	3. *Return* `sequence`.
```



## Statement Lists


### Static Semantics: Decorate (Statement Lists)
```
Decorate(Statement__List ::= Statement) -> Sequence<SemanticStatement>
	:= [Decorate(Statement)];
Decorate(Statement__List ::= Statement__List Statement) -> Sequence<SemanticStatement>
	:= [
		...Decorate(Statement__List),
		Decorate(Statement),
	];
```
