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


### Abstract Operation: EvaluateNumericBinaryExpression
```w3c
EvaluateNumericBinaryExpression(op) :=
	1. Assert the count of the operand stack is at least 2.
	2. Pop `operand2` off the operand stack.
	3. Pop `operand1` off the operand stack.
	4. Let `operation` be a function obtained from the following record, keyed by `op`: {
		`ADD`: Return the sum, `arg1 + arg2`,
			obtained by adding `arg1` (the augend) to `arg2` (the addend).
		`MUL`: Return the product, `arg1 * arg2`,
			obtained by multiplying `arg1` (the multiplicand) by `arg2` (the multiplier).
		`DIV`: Return the quotient, `arg1 / arg2`,
			obtained by dividing `arg1` (the dividend) by `arg2` (the divisor).
		`EXP`: Return the power, `arg1 ^ arg2`,
				obtained by raising `arg1` (the base) to `arg2` (the exponent).
	}
	5. Push `operation(operand1, operand2)` onto the operand stack.
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

Decorate(TEMPLATE_FULL)
	:= SemanticConstant {value: TV(TEMPLATE_FULL)} []
Decorate(TEMPLATE_HEAD)
	:= SemanticConstant {value: TV(TEMPLATE_HEAD)} []
Decorate(TEMPLATE_MIDDLE)
	:= SemanticConstant {value: TV(TEMPLATE_MIDDLE)} []
Decorate(TEMPLATE_TAIL)
	:= SemanticConstant {value: TV(TEMPLATE_TAIL)} []

Decorate(STRING)
	:= SemanticConstant {value: SV(STRING)} []

Decorate(NUMBER)
	:= SemanticConstant {value: MV(NUMBER)} []

Decorate(IDENTIFIER)
	:= SemanticIdentifier {id: WV(IDENTIFIER)} []
```
Where
`TV` is [Template Value](./lexical-structure.md#static-semantics-template-value),
`SV` is [String Value](./lexical-structure.md#static-semantics-string-value),
`MV` is [Mathematical Value](./lexical-structure.md#static-semantics-mathematical-value),
`WV` is [Word Value](./lexical-structure.md#static-semantics-word-value).



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


### Runtime Instructions: Evaluation (Expression Units)
```w3c
Evaluate(SemanticConstant) :=
	1. Push `SemanticConstant.value` onto the operand stack.
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


### Runtime Instructions: Evaluation (Unary Operators)
```w3c
Evaluate(SemanticExpression[operator=NEG]) :=
	1. Assert `SemanticExpression.children.count` is 1.
	2. Perform `Evaluate(SemanticExpression.children.0)`.
	3. Assert the count of the operand stack is at least 1.
	4. Pop `operand` off the operand stack.
	5. Let `negation` be the additive inverse, `-operand`,
		obtained by negating `operand`.
	6. Push `negation` onto the operand stack.
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


### Runtime Instructions: Evaluation (Exponentiation)
```w3c
Evaluate(SemanticExpression[operator=EXP]) :=
	1. Assert `SemanticExpression.children.count` is 2.
	2. Perform `Evaluate(SemanticExpression.children.0)`.
	3. Perform `Evaluate(SemanticExpression.children.1)`.
	4. Perform `EvaluateNumericBinaryExpression(EXP)`
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


### Runtime Instructions: Evaluation (Multiplication/Division)
```w3c
Evaluate(SemanticExpression[operator=MUL]) :=
	1. Assert `SemanticExpression.children.count` is 2.
	2. Perform `Evaluate(SemanticExpression.children.0)`.
	3. Perform `Evaluate(SemanticExpression.children.1)`.
	4. Perform `EvaluateNumericBinaryExpression(MUL)`
Evaluate(SemanticExpression[operator=DIV]) :=
	1. Assert `SemanticExpression.children.count` is 2.
	2. Perform `Evaluate(SemanticExpression.children.0)`.
	3. Perform `Evaluate(SemanticExpression.children.1)`.
	4. Perform `EvaluateNumericBinaryExpression(DIV)`
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


### Runtime Instructions: Evaluation (Addition/Subtraction)
```w3c
Evaluate(SemanticExpression[operator=ADD]) :=
	1. Assert `SemanticExpression.children.count` is 2.
	2. Perform `Evaluate(SemanticExpression.children.0)`.
	3. Perform `Evaluate(SemanticExpression.children.1)`.
	4. Perform `EvaluateNumericBinaryExpression(ADD)`
```
