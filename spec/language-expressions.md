# Solid Language: Expressions

This chapter defines the syntactic structure and semantics of expressions in the Solid programming language.

```w3c
Expression ::= ExpressionAdditive
```



## Expression Units
```w3c
ExpressionUnit ::= NUMBER | "(" Expression ")"
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
