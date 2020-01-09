# Solid Language: Statements

This chapter defines the syntactic structure and semantics of statements in the Solid programming language.

```w3c
Statement ::=
	DeclarationVariable |
	StatementAssignment |
	Expression ";"
```



## Variable Declaration
```w3c
DeclarationVariable ::= "let" "unfixed"? IDENTIFIER "=" Expression ";"
```



## Variable Assignment
```w3c
StatementAssignment ::= IDENTIFIER "=" Expression ";"
```
