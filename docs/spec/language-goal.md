# Solid Language: Goal Symbols
This chapter defines the syntax, semantics, and behavior of goal symbols in the Solid programming language.

```w3c
Goal ::= #x02 Statement* #x03;
```


### Static Semantics: Decorate (Goal Symbols)
```w3c
Decorate(Goal ::= #x02 #x03)
	:= SemanticNull {} []
Decorate(Goal ::= #x02 Statement__List #x03)
	:= Decorate(Statement__List)

Decorate(Statement__List ::= Statement)
	:= SemanticStatementList {} [
		Decorate(Statement),
	]
Decorate(Statement__List ::= Statement__List Statement)
	:= SemanticStatementList {} [
		Spread(Decorate(Statement__List)),
		Decorate(Statement),
	]
```
