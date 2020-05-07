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


### Static Semantics: Compilation (Unary Operators)
```w3c
Compile(SemanticExpression[operator="+"]) :=
	1. assert the number of `SemanticExpression.children` is 1.
	2. perform `Compile(SemanticExpression.children.0)`.
	4. push `AFF` onto `STACK`.
Compile(SemanticExpression[operator="-"]) :=
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
	:= SemanticExpression {operator: "^"} [
		Decorate(ExpressionUnarySymbol),
		Decorate(ExpressionExponential),
	]
```


### Static Semantics: Compilation (Exponentiation)
```w3c
Compile(SemanticExpression[operator="^"]) :=
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


### Static Semantics: Compilation (Multiplication/Division)
```w3c
Compile(SemanticExpression[operator="*"]) :=
	1. assert the number of `SemanticExpression.children` is 2.
	2. perform `Compile(SemanticExpression.children.0)`.
	3. perform `Compile(SemanticExpression.children.1)`.
	4. push `MUL` onto `STACK`.
Compile(SemanticExpression[operator="/"]) :=
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
	:= SemanticExpression {operator: "+"} [
		Decorate(ExpressionAdditive),
		Decorate(ExpressionMultiplicative),
	]
Decorate(ExpressionAdditive ::= ExpressionAdditive "-" ExpressionMultiplicative)
	:= SemanticExpression {operator: "+"} [
		Decorate(ExpressionAdditive),
		SemanticExpression {operator: "-"} [
			Decorate(ExpressionMultiplicative),
		],
	]
```


### Static Semantics: Compilation (Addition/Subtraction)
```w3c
Compile(SemanticExpression[operator="+"]) :=
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
