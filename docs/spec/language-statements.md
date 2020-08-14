# Solid Language: Statements
This chapter defines the syntax, semantics, and behavior of statements in the Solid programming language.


### Static Semantics: Semantic Schema (Statements)
```
SemanticStatement =:=
	| SemanticStatementExpression
	| SemanticDeclaration
	| SemanticAssignment
;

SemanticStatementExpression
	::= SemanticExpression?;
```


### Static Semantics: Decorate (Statements)
```
Decorate(Statement ::= ";") -> SemanticStatementExpression
	:= (SemanticStatementExpression);
Decorate(Statement ::= Expression ";") -> SemanticStatementExpression
	:= (SemanticStatementExpression Decorate(Expression));
Decorate(Statement ::= DeclarationVariable) -> SemanticDeclaration
	:= Decorate(DeclarationVariable);
Decorate(Statement ::= StatementAssignment) -> SemanticAssignment
	:= Decorate(StatementAssignment);
```


### Runtime Instructions: Build (Statements)
```
Sequence<Instruction> Build(SemanticStatementExpression stmt) :=
	1. *Let* `sequence` be an empty sequence of `Instruction`s.
	2. *If* `stmt.children.count` is greater than 0:
		1. *Set* `sequence` to the result of performing `TryAssessAndBuild(stmt.children.0)`.
	3. *Return* `sequence`.
```



## Variable Declaration


### Static Semantics: Semantic Schema (Variable Declaration)
```
SemanticDeclaration[type: "variable"][unfixed: Boolean]
	::= SemanticAssignee SemanticAssigned;

SemanticAssignee
	::= SemanticIdentifier;

SemanticAssigned
	::= SemanticExpression;
```


### Static Semantics: Decorate (Variable Declaration)
```
Decorate(DeclarationVariable ::= "let" IDENTIFIER "=" Expression ";") -> SemanticDeclaration
	:= (SemanticDeclaration[type="variable"][unfixed=false]
		(SemanticAssignee
			(SemanticIdentifier[id=TokenWorth(IDENTIFIER)])
		)
		(SemanticAssigned Decorate(Expression))
	);
Decorate(DeclarationVariable ::= "let" "unfixed" IDENTIFIER "=" Expression ";") -> SemanticDeclaration
	:= (SemanticDeclaration[type="variable"][unfixed=true]
		(SemanticAssignee
			(SemanticIdentifier[id=TokenWorth(IDENTIFIER)])
		)
		(SemanticAssigned Decorate(Expression))
	);
```


### Runtime Instructions: Build (Variable Declaration)
```
Sequence<Instruction> Build(SemanticDeclaration decl) :=
	/* TO BE DETERMINED */
```



## Variable Assignment


### Static Semantics: Semantic Schema (Variable Assignment)
```
SemanticAssignment
	::= SemanticAssignee SemanticAssigned;
```


### Static Semantics: Decorate (Variable Assignment)
```
Decorate(StatementAssignment ::= IDENTIFIER "=" Expression ";") -> SemanticAssignment
	:= (SemanticAssignment
		(SemanticAssignee
			(SemanticIdentifier[id=TokenWorth(IDENTIFIER)])
		)
		(SemanticAssigned Decorate(Expression))
	);
```


### Runtime Instructions: Build (Variable Assignment)
```
Sequence<Instruction> Build(SemanticAssignment assign) :=
	/* TO BE DETERMINED */
```
