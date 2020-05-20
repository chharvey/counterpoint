# Solid Language: Expressions
This chapter defines the syntax, semantics, and behavior of expressions in the Solid programming language.

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
	1. Assert: The count of the operand stack is at least 2.
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
PrimitiveLiteral ::=
	NUMBER |
	STRING

StringTemplate ::=
	TEMPLATE_FULL |
	TEMPLATE_HEAD Expression? (TEMPLATE_MIDDLE Expression?)* TEMPLATE_TAIL
```


### Static Semantics: Decoration (Literals)
```w3c
Decorate(PrimitiveLiteral ::= NUMBER)
	:= SemanticConstant {value: MV(NUMBER)} []

Decorate(PrimitiveLiteral ::= STRING)
	:= SemanticConstant {value: SV(STRING)} []

Decorate(StringTemplate ::= TEMPLATE_FULL)
	:= SemanticTemplate {type: "full"} [
		SemanticConstant {value: TV(TEMPLATE_FULL)} [],
	]
Decorate(StringTemplate ::= TEMPLATE_HEAD TEMPLATE_TAIL)
	:= SemanticTemplate {type: "substitution"} [
		SemanticConstant {value: TV(TEMPLATE_HEAD)} [],
		SemanticConstant {value: TV(TEMPLATE_TAIL)} [],
	]
Decorate(StringTemplate ::= TEMPLATE_HEAD Expression TEMPLATE_TAIL)
	:= SemanticTemplate {type: "substitution"} [
		SemanticConstant {value: TV(TEMPLATE_HEAD)} [],
		Decorate(Expression),
		SemanticConstant {value: TV(TEMPLATE_TAIL)} [],
	]
Decorate(StringTemplate ::= TEMPLATE_HEAD StringTemplate__0__List TEMPLATE_TAIL)
	:= SemanticTemplate {type: "substitution"} [
		SemanticConstant {value: TV(TEMPLATE_HEAD)} [],
		Spread(Decorate(StringTemplate__0__List))
		SemanticConstant {value: TV(TEMPLATE_TAIL)} [],
	]
Decorate(StringTemplate ::= TEMPLATE_HEAD Expression StringTemplate__0__List TEMPLATE_TAIL)
	:= SemanticTemplate {type: "substitution"} [
		SemanticConstant {value: TV(TEMPLATE_HEAD)} [],
		Decorate(Expression),
		Spread(Decorate(StringTemplate__0__List)),
		SemanticConstant {value: TV(TEMPLATE_TAIL)} [],
	]

Decorate(StringTemplate__0__List ::= TEMPLATE_MIDDLE)
	:= SemanticTemplatePartial {} [
		SemanticConstant {value: TV(TEMPLATE_MIDDLE)} [],
	]
Decorate(StringTemplate__0__List ::= TEMPLATE_MIDDLE Expression)
	:= SemanticTemplatePartial {} [
		SemanticConstant {value: TV(TEMPLATE_MIDDLE)} [],
		Decorate(Expression),
	]
Decorate(StringTemplate__0__List ::= StringTemplate__0__List TEMPLATE_MIDDLE)
	:= SemanticTemplatePartial {} [
		Spread(Decorate(StringTemplate__0__List)),
		SemanticConstant {value: TV(TEMPLATE_MIDDLE)} [],
	]
Decorate(StringTemplate__0__List ::= StringTemplate__0__List TEMPLATE_MIDDLE Expression)
	:= SemanticTemplatePartial {} [
		Spread(Decorate(StringTemplate__0__List)),
		SemanticConstant {value: TV(TEMPLATE_MIDDLE)} [],
		Decorate(Expression),
	]
```
Where
- `MV` is [Mathematical Value](./language-lexicon.md#static-semantics-mathematical-value)
- `SV` is [String Value](./language-lexicon.md#static-semantics-string-value)
- `TV` is [Template Value](./language-lexicon.md#static-semantics-template-value)



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
	:= SemanticIdentifier {id: IV(IDENTIFIER)} []
Decorate(ExpressionUnit ::= PrimitiveLiteral)
	:= Decorate(PrimitiveLiteral)
Decorate(ExpressionUnit ::= StringTemplate)
	:= Decorate(StringTemplate)
Decorate(ExpressionUnit ::= "(" Expression ")")
	:= Decorate(Expression)
```
Where
- `IV` is [Identifier Value](./language-lexicon.md#static-semantics-identifier-value)


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
	1. Assert: `SemanticExpression.children.count` is 1.
	2. Perform: `Evaluate(SemanticExpression.children.0)`.
	3. Assert: The count of the operand stack is at least 1.
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
	1. Assert:`SemanticExpression.children.count` is 2.
	2. Perform: `Evaluate(SemanticExpression.children.0)`.
	3. Perform: `Evaluate(SemanticExpression.children.1)`.
	4. Perform: `EvaluateNumericBinaryExpression(EXP)`
```



## Multiplicative
```w3c
ExpressionMultiplicative ::= (ExpressionMultiplicative ("*" | "/"))? ExpressionExponential
```


### Static Semantics: Decoration (Multiplicative)
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


### Runtime Instructions: Evaluation (Multiplicative)
```w3c
Evaluate(SemanticExpression[operator=MUL]) :=
	1. Assert: `SemanticExpression.children.count` is 2.
	2. Perform: `Evaluate(SemanticExpression.children.0)`.
	3. Perform: `Evaluate(SemanticExpression.children.1)`.
	4. Perform: `EvaluateNumericBinaryExpression(MUL)`
Evaluate(SemanticExpression[operator=DIV]) :=
	1. Assert: `SemanticExpression.children.count` is 2.
	2. Perform: `Evaluate(SemanticExpression.children.0)`.
	3. Perform: `Evaluate(SemanticExpression.children.1)`.
	4. Perform: `EvaluateNumericBinaryExpression(DIV)`
```



## Additive
```w3c
ExpressionAdditive ::= (ExpressionAdditive ("+" | "-"))? ExpressionMultiplicative
```


### Static Semantics: Decoration (Additive)
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


### Runtime Instructions: Evaluation (Additive)
```w3c
Evaluate(SemanticExpression[operator=ADD]) :=
	1. Assert: `SemanticExpression.children.count` is 2.
	2. Perform: `Evaluate(SemanticExpression.children.0)`.
	3. Perform: `Evaluate(SemanticExpression.children.1)`.
	4. Perform: `EvaluateNumericBinaryExpression(ADD)`
```
