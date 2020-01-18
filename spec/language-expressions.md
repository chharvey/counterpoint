# Solid Language: Expressions

This chapter defines the syntactic structure and semantics of expressions in the Solid programming language.

```w3c
Expression ::= ExpressionAdditive
```


### Static Semantics: Decoration (Expressions)
```w3c
Decorate(Expression ::= ExpressionAdditive)
	:= Decorate(ExpressionAdditive)
```



## Literals
```w3c
StringTemplate ::=
	TEMPLATE_FULL |
	TEMPLATE_HEAD Expression? (TEMPLATE_MIDDLE Expression?)* TEMPLATE_TAIL

PrimitiveLiteral ::=
	NUMBER |
	STRING
```


### Static Semantics: Decoration (Literals)
```w3c
Decorate(StringTemplate ::= TEMPLATE_FULL)
	:= SemanticTemplate {type: "full"} [
		Decorate(TEMPLATE_FULL),
	]
Decorate(StringTemplate ::= TEMPLATE_HEAD TEMPLATE_TAIL)
	:= SemanticTemplate {type: "substitution"} [
		Decorate(TEMPLATE_HEAD),
		Decorate(TEMPLATE_TAIL),
	]
Decorate(StringTemplate ::= TEMPLATE_HEAD Expression TEMPLATE_TAIL)
	:= SemanticTemplate {type: "substitution"} [
		Decorate(TEMPLATE_HEAD),
		Decorate(Expression),
		Decorate(TEMPLATE_TAIL),
	]
Decorate(StringTemplate ::= TEMPLATE_HEAD StringTemplate__0__List TEMPLATE_TAIL)
	:= SemanticTemplate {type: "substitution"} [
		Decorate(TEMPLATE_HEAD),
		Spread(Decorate(StringTemplate__0__List))
		Decorate(TEMPLATE_TAIL),
	]
Decorate(StringTemplate ::= TEMPLATE_HEAD Expression StringTemplate__0__List TEMPLATE_TAIL)
	:= SemanticTemplate {type: "substitution"} [
		Decorate(TEMPLATE_HEAD),
		Decorate(Expression),
		Spread(Decorate(StringTemplate__0__List)),
		Decorate(TEMPLATE_TAIL),
	]

Decorate(StringTemplate__0__List ::= TEMPLATE_MIDDLE)
	:= SemanticTemplatePartial {} [
		Decorate(TEMPLATE_MIDDLE),
	]
Decorate(StringTemplate__0__List ::= TEMPLATE_MIDDLE Expression)
	:= SemanticTemplatePartial {} [
		Decorate(TEMPLATE_MIDDLE),
		Decorate(Expression),
	]
Decorate(StringTemplate__0__List ::= StringTemplate__0__List TEMPLATE_MIDDLE)
	:= SemanticTemplatePartial {} [
		Spread(Decorate(StringTemplate__0__List)),
		Decorate(TEMPLATE_MIDDLE),
	]
Decorate(StringTemplate__0__List ::= StringTemplate__0__List TEMPLATE_MIDDLE Expression)
	:= SemanticTemplatePartial {} [
		Spread(Decorate(StringTemplate__0__List)),
		Decorate(TEMPLATE_MIDDLE),
		Decorate(Expression),
	]

Decorate(PrimitiveLiteral ::= NUMBER)
	:= Decorate(NUMBER)
Decorate(PrimitiveLiteral ::= STRING)
	:= Decorate(STRING)
```



## Expression Units
```w3c
ExpressionUnit ::=
	IDENTIFIER         |
	PrimitiveLiteral   |
	StringTemplate     |
	"(" Expression ")"
```


### Static Semantics: Decoration (Expression Units)
```w3c
Decorate(ExpressionUnit ::= IDENTIFIER)
	:= Decorate(IDENTIFIER)
Decorate(ExpressionUnit ::= PrimitiveLiteral)
	:= Decorate(PrimitiveLiteral)
Decorate(ExpressionUnit ::= StringTemplate)
	:= Decorate(StringTemplate)
Decorate(ExpressionUnit ::= "(" Expression ")")
	:= Decorate(Expression)
```



## Unary Operators
```w3c
ExpressionUnarySymbol ::= ExpressionUnit | ("+" | "-") ExpressionUnarySymbol
```


### Static Semantics: Decoration (Unary Operators)
```w3c
Decorate(ExpressionUnarySymbol ::= ExpressionUnit)
	:= Decorate(ExpressionUnit)
Decorate(ExpressionUnarySymbol ::= "+" ExpressionUnarySymbol)
	:= SemanticExpression {operator: "+"} [
		Decorate(ExpressionUnarySymbol),
	]
Decorate(ExpressionUnarySymbol ::= "-" ExpressionUnarySymbol)
	:= SemanticExpression {operator: "-"} [
		Decorate(ExpressionUnarySymbol),
	]
```



## Exponentiation
```w3c
ExpressionExponential ::=  ExpressionUnarySymbol ("^" ExpressionExponential)?
```


### Static Semantics: Decoration (Exponentiation)
```w3c
Decorate(ExpressionExponential ::= ExpressionUnarySymbol)
	:= Decorate(ExpressionUnarySymbol)
Decorate(ExpressionExponential ::= ExpressionUnarySymbol "^" ExpressionExponential)
	:= SemanticExpression {operator: "^"} [
		Decorate(ExpressionUnarySymbol),
		Decorate(ExpressionExponential),
	]
```



## Multiplication/Division
```w3c
ExpressionMultiplicative ::= (ExpressionMultiplicative ("*" | "/"))? ExpressionExponential
```


### Static Semantics: Decoration (Multiplication/Division)
```w3c
Decorate(ExpressionMultiplicative ::= ExpressionExponential)
	:= Decorate(ExpressionExponential)
Decorate(ExpressionMultiplicative ::= ExpressionMultiplicative "*" ExpressionExponential)
	:= SemanticExpression {operator: "*"} [
		Decorate(ExpressionMultiplicative),
		Decorate(ExpressionExponential),
	]
Decorate(ExpressionMultiplicative ::= ExpressionMultiplicative "/" ExpressionExponential)
	:= SemanticExpression {operator: "/"} [
		Decorate(ExpressionMultiplicative),
		Decorate(ExpressionExponential),
	]
```



## Addition/Subtraction
```w3c
ExpressionAdditive ::= (ExpressionAdditive ("+" | "-"))? ExpressionMultiplicative
```


### Static Semantics: Decoration (Addition/Subtraction)
```w3c
Decorate(ExpressionAdditive ::= ExpressionMultiplicative)
	:= Decorate(ExpressionMultiplicative)
Decorate(ExpressionAdditive ::= ExpressionAdditive "+" ExpressionMultiplicative)
	:= SemanticExpression {operator: "+"} [
		Decorate(ExpressionAdditive),
		Decorate(ExpressionMultiplicative),
	]
Decorate(ExpressionAdditive ::= ExpressionAdditive "-" ExpressionMultiplicative)
	:= SemanticExpression {operator: "-"} [
		Decorate(ExpressionAdditive),
		Decorate(ExpressionMultiplicative),
	]
```
