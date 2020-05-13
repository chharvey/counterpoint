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



## Expression Units
```w3c
ExpressionUnit ::= NUMBER | "(" Expression ")"
```


### Static Semantics: Decoration (Expression Units)
```w3c
Decorate(ExpressionUnit ::= NUMBER)
	:= Decorate(NUMBER)
Decorate(ExpressionUnit ::= "(" Expression ")")
	:= Decorate(Expression)

Decorate(NUMBER)
	:= SemanticConstant {value: MV(NUMBER)} []
```
where `MV` is [Mathematical Value](./lexical-structure.md#static-semantics-mathematical-value).


### Static Semantics: Compilation (Expression Units)
```w3c
Compile(SemanticConstant) :=
	1. push `SemanticConstant.value` onto `STACK`.
```


### Runtime Semantics: Evaluation (Expression Units)
```w3c
Evaluate(STACK) :=
	1. assert `STACK` is not empty.
	2. let `it` be `STACK.lastItem`.
	3. pop `STACK`.
	4. return `it`.
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
	:= Decorate(ExpressionUnarySymbol)
Decorate(ExpressionUnarySymbol ::= "-" ExpressionUnarySymbol)
	:= SemanticExpression {operator: NEG} [
		Decorate(ExpressionUnarySymbol),
	]
```


### Static Semantics: Compilation (Unary Operators)
```w3c
Compile(SemanticExpression[operator=NEG]) :=
	1. assert the number of `SemanticExpression.children` is 1.
	2. perform `Compile(SemanticExpression.children.0)`.
	4. push `NEG` onto `STACK`.
```


### Runtime Semantics: Evaluation (Unary Operators)
```w3c
Evaluate(STACK) :=
	1. assert `STACK` is not empty.
	2. let `it` be `STACK.lastItem`.
	3. assert `it` is either `AFF` or `NEG`.
	4. pop `STACK`.
	6. let `arg` be `EVALUATE(STACK)`.
	7. if `it` is `NEG`, then return the negation, `-arg`,
		obtained by negating `arg`.
	9. return `arg`.
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
	:= SemanticExpression {operator: EXP} [
		Decorate(ExpressionUnarySymbol),
		Decorate(ExpressionExponential),
	]
```


### Static Semantics: Compilation (Exponentiation)
```w3c
Compile(SemanticExpression[operator=EXP]) :=
	1. assert the number of `SemanticExpression.children` is 2.
	2. perform `Compile(SemanticExpression.children.0)`.
	3. perform `Compile(SemanticExpression.children.1)`.
	4. push `EXP` onto `STACK`.
```


### Runtime Semantics: Evaluation (Exponentiation)
```w3c
Evaluate(STACK) :=
	1. assert `STACK` is not empty.
	2. let `it` be `STACK.lastItem`.
	3. assert `it` is `EXP`.
	4. pop `STACK`.
	5. let `arg2` be `Evaluate(STACK)`.
	6. let `arg1` be `EVALUATE(STACK)`.
	7. return the power, `arg1 ^ arg2`,
		obtained by raising `arg1` (the base) to `arg2` (the exponent).
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
	:= SemanticExpression {operator: MUL} [
		Decorate(ExpressionMultiplicative),
		Decorate(ExpressionExponential),
	]
Decorate(ExpressionMultiplicative ::= ExpressionMultiplicative "/" ExpressionExponential)
	:= SemanticExpression {operator: DIV} [
		Decorate(ExpressionMultiplicative),
		Decorate(ExpressionExponential),
	]
```


### Static Semantics: Compilation (Multiplication/Division)
```w3c
Compile(SemanticExpression[operator=MUL]) :=
	1. assert the number of `SemanticExpression.children` is 2.
	2. perform `Compile(SemanticExpression.children.0)`.
	3. perform `Compile(SemanticExpression.children.1)`.
	4. push `MUL` onto `STACK`.
Compile(SemanticExpression[operator=DIV]) :=
	1. assert the number of `SemanticExpression.children` is 2.
	2. perform `Compile(SemanticExpression.children.0)`.
	3. perform `Compile(SemanticExpression.children.1)`.
	4. push `DIV` onto `STACK`.
```


### Runtime Semantics: Evaluation (Multiplication/Division)
```w3c
Evaluate(STACK) :=
	1. assert `STACK` is not empty.
	2. let `it` be `STACK.lastItem`.
	3. assert `it` is either `MUL` or `DIV`.
	4. pop `STACK`.
	5. let `arg2` be `Evaluate(STACK)`.
	6. let `arg1` be `EVALUATE(STACK)`.
	7. if `it` is `MUL`, then return the product, `arg1 * arg2`,
		obtained by multiplying `arg1` (the multiplicand) by `arg2` (the multiplier).
	8. if `it` is `DIV`, then return the quotient, `arg1 / arg2`,
		obtained by dividing `arg1` (the dividend) by `arg2` (the divisor).
	9. return 0.
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
	:= SemanticExpression {operator: ADD} [
		Decorate(ExpressionAdditive),
		Decorate(ExpressionMultiplicative),
	]
Decorate(ExpressionAdditive ::= ExpressionAdditive "-" ExpressionMultiplicative)
	:= SemanticExpression {operator: ADD} [
		Decorate(ExpressionAdditive),
		SemanticExpression {operator: NEG} [
			Decorate(ExpressionMultiplicative),
		],
	]
```


### Static Semantics: Compilation (Addition/Subtraction)
```w3c
Compile(SemanticExpression[operator=ADD]) :=
	1. assert the number of `SemanticExpression.children` is 2.
	2. perform `Compile(SemanticExpression.children.0)`.
	3. perform `Compile(SemanticExpression.children.1)`.
	4. push `ADD` onto `STACK`.
```


### Runtime Semantics: Evaluation (Addition/Subtraction)
```w3c
Evaluate(STACK) :=
	1. assert `STACK` is not empty.
	2. let `it` be `STACK.lastItem`.
	3. assert `it` is `ADD`.
	4. pop `STACK`.
	5. let `arg2` be `Evaluate(STACK)`.
	6. let `arg1` be `EVALUATE(STACK)`.
	7. return the sum, `arg1 + arg2`,
		obtained by adding `arg1` (the augend) to `arg2` (the addend).
```
