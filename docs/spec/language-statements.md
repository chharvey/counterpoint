# Solid Language: Statements
This chapter defines the syntax, semantics, and behavior of statements in the Solid programming language.

```w3c
Statement ::=
	Expression? ";"     |
	DeclarationVariable |
	StatementAssignment |
```


### Static Semantics: Decorate (Statements)
```w3c
Decorate(Statement ::= DeclarationVariable)
	:= Decorate(DeclarationVariable)
Decorate(Statement ::= StatementAssignment)
	:= Decorate(StatementAssignment)
Decorate(Statement ::= Expression ";")
	:= SemanticStatement {type: "expression"} [
		Decorate(Expression),
	]
Decorate(Statement ::= ";")
	:= SemanticStatement {type: "expression"} []
```



## Variable Declaration
```w3c
DeclarationVariable ::= "let" "unfixed"? IDENTIFIER "=" Expression ";"
```


### Static Semantics: Decorate (Variable Declaration)
```w3c
Decorate(DeclarationVariable ::= "let" IDENTIFIER "=" Expression ";")
	:= SemanticDeclaration {type: "variable", unfixed: false} [
		SemanticAssignee {} [
			SemanticIdentifier {id: TokenWorth(IDENTIFIER)} [],
		],
		SemanticAssigned {} [
			Decorate(Expression),
		],
	]
Decorate(DeclarationVariable ::= "let" "unfixed" IDENTIFIER "=" Expression ";")
	:= SemanticDeclaration {type: "variable", unfixed: true} [
		SemanticAssignee {} [
			SemanticIdentifier {id: TokenWorth(IDENTIFIER)} [],
		],
		SemanticAssigned {} [
			Decorate(Expression),
		],
	]
```



## Variable Assignment
```w3c
StatementAssignment ::= IDENTIFIER "=" Expression ";"
```


### Static Semantics: Decorate (Variable Assignment)
```w3c
Decorate(StatementAssignment ::= IDENTIFIER "=" Expression ";")
	:= SemanticAssignment {} [
		SemanticAssignee {} [
			SemanticIdentifier {id: TokenWorth(IDENTIFIER)} [],
		],
		SemanticAssigned {} [
			Decorate(Expression),
		],
	]
```
