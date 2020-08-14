# Solid Language: Goal Symbols
This chapter defines the syntax, semantics, and behavior of goal symbols in the Solid programming language.


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
