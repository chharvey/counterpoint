# Solid Language: Statements
This chapter defines the syntax, semantics, and behavior of statements in the Solid programming language.

```w3c
Statement ::=
	| Expression? ";"
	| DeclarationVariable
	| StatementAssignment
;
```


### Static Semantics: Decorate (Statements)
```w3c
Decorate(Statement ::= ";") -> SemanticStatementExpression
	:= SemanticStatementExpression {} [];
Decorate(Statement ::= Expression ";") -> SemanticStatementExpression
	:= SemanticStatementExpression {} [
		Decorate(Expression),
	];
Decorate(Statement ::= DeclarationVariable) -> SemanticDeclaration
	:= Decorate(DeclarationVariable);
Decorate(Statement ::= StatementAssignment) -> SemanticAssignment
	:= Decorate(StatementAssignment);
```


### Runtime Instructions: Build (Statements)
```w3c
Sequence<Instruction> Build(SemanticStatementExpression stmt) :=
	1. *Let* `sequence` be an empty sequence of `Instruction`s.
	2. *If* `stmt.children.count` is greater than 0:
		1. *Let* `expr` be `stmt.children.0`.
		2. *Set* `sequence` to the result of performing `Build(expr)`.
	3. *Return* `sequence`.
```



## Variable Declaration
```w3c
DeclarationVariable ::= "let" "unfixed"? IDENTIFIER "=" Expression ";";
```


### Static Semantics: Decorate (Variable Declaration)
```w3c
Decorate(DeclarationVariable ::= "let" IDENTIFIER "=" Expression ";") -> SemanticDeclaration
	:= SemanticDeclaration {type: "variable", unfixed: false} [
		SemanticAssignee {} [
			SemanticIdentifier {id: TokenWorth(IDENTIFIER)} [],
		],
		SemanticAssigned {} [
			Decorate(Expression),
		],
	];
Decorate(DeclarationVariable ::= "let" "unfixed" IDENTIFIER "=" Expression ";") -> SemanticDeclaration
	:= SemanticDeclaration {type: "variable", unfixed: true} [
		SemanticAssignee {} [
			SemanticIdentifier {id: TokenWorth(IDENTIFIER)} [],
		],
		SemanticAssigned {} [
			Decorate(Expression),
		],
	];
```


### Runtime Instructions: Build (Variable Declaration)
```w3c
Sequence<Instruction> Build(SemanticDeclaration decl) :=
	/* TO BE DETERMINED */
```



## Variable Assignment
```w3c
StatementAssignment ::= IDENTIFIER "=" Expression ";";
```


### Static Semantics: Decorate (Variable Assignment)
```w3c
Decorate(StatementAssignment ::= IDENTIFIER "=" Expression ";") -> SemanticAssignment
	:= SemanticAssignment {} [
		SemanticAssignee {} [
			SemanticIdentifier {id: TokenWorth(IDENTIFIER)} [],
		],
		SemanticAssigned {} [
			Decorate(Expression),
		],
	];
```


### Runtime Instructions: Build (Variable Assignment)
```w3c
Sequence<Instruction> Build(SemanticAssignment assign) :=
	/* TO BE DETERMINED */
```
