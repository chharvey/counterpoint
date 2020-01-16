# Solid Language: Statements

This chapter defines the syntactic structure and semantics of statements in the Solid programming language.

```w3c
Statement ::=
	DeclarationVariable |
	StatementAssignment |
	Expression? ";"
```


### Static Semantics: Decoration (Statements)
```w3c
Decorate(Statement ::= DeclarationVariable)
	:= Decorate(DeclarationVariable)
Decorate(Statement ::= StatementAssignment)
	:= Decorate(StatementAssignment)
Decorate(Statement ::= Expression ";")
	:= Decorate(Expression)
Decorate(Statement ::= ";")
	:= SemanticNull {} []
```



## Variable Declaration
```w3c
DeclarationVariable ::= "let" "unfixed"? IDENTIFIER "=" Expression ";"
```


### Static Semantics: Decoration (Variable Declaration)
```w3c
Decorate(DeclarationVariable ::= "let" IDENTIFIER "=" Expression ";")
	:= SemanticDeclaration {type: "variable", unfixed: false} [
		SemanticIdentifier {id: WV(IDENTIFIER)} [],
		Decorate(Expression),
	]
Decorate(DeclarationVariable ::= "let" "unfixed" IDENTIFIER "=" Expression ";")
	:= SemanticDeclaration {type: "variable", unfixed: true} [
		SemanticIdentifier {id: WV(IDENTIFIER)} [],
		Decorate(Expression),
	]
```



## Variable Assignment
```w3c
StatementAssignment ::= IDENTIFIER "=" Expression ";"
```


### Static Semantics: Decoration (Variable Assignment)
```w3c
Decorate(StatementAssignment ::= IDENTIFIER "=" Expression ";")
	:= SemanticAssignment {} [
		SemanticIdentifier {id: WV(IDENTIFIER)} [],
		Decorate(Expression),
	]
```
