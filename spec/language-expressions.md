# Solid Language: Expressions

This chapter defines the syntactic structure and semantics of expressions in the Solid programming language.

```w3c
Expression ::= ExpressionAdditive
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



## Expression Units
```w3c
ExpressionUnit ::=
	IDENTIFIER         |
	PrimitiveLiteral   |
	StringTemplate     |
	"(" Expression ")"
```



## Unary Operators
```w3c
ExpressionUnarySymbol ::= ExpressionUnit | ("+" | "-") ExpressionUnarySymbol
```



## Exponentiation
```w3c
ExpressionExponential ::=  ExpressionUnarySymbol ("^" ExpressionExponential)?
```



## Multiplication/Division
```w3c
ExpressionMultiplicative ::= (ExpressionMultiplicative ("*" | "/"))? ExpressionExponential
```



## Addition/Subtraction
```w3c
ExpressionAdditive ::= (ExpressionAdditive ("+" | "-"))? ExpressionMultiplicative
```
