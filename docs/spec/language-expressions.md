# Solid Language: Expressions
This chapter defines the syntax, semantics, and behavior of expressions in the Solid programming language.

```w3c
Expression ::= ExpressionAdditive;
```


### Static Semantics: Decorate (Expressions)
```w3c
Decorate(Expression ::= ExpressionAdditive) -> SemanticIdentifier | SemanticConstant | SemanticTemplate | SemanticExpression
	:= Decorate(ExpressionAdditive);
```


### Abstract Operation: EvaluateNumericBinaryExpression
The abstract operation `EvaluateNumericBinaryExpression` performs a binary stack operation.
```w3c
Void EvaluateNumericBinaryExpression(Text op) :=
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
	| NUMBER
	| STRING
;

StringTemplate ::=
	| TEMPLATE_FULL
	| TEMPLATE_HEAD Expression? (TEMPLATE_MIDDLE Expression?)* TEMPLATE_TAIL
;
```


### Static Semantics: Decorate (Literals)
```w3c
Decorate(PrimitiveLiteral ::= NUMBER) -> SemanticConstant
	:= SemanticConstant {value: TokenWorth(NUMBER)} [];

Decorate(PrimitiveLiteral ::= STRING) -> SemanticConstant
	:= SemanticConstant {value: TokenWorth(STRING)} [];

Decorate(StringTemplate ::= TEMPLATE_FULL) -> SemanticTemplate
	:= SemanticTemplate {type: "full"} [
		SemanticConstant {value: TokenWorth(TEMPLATE_FULL)} [],
	];
Decorate(StringTemplate ::= TEMPLATE_HEAD TEMPLATE_TAIL) -> SemanticTemplate
	:= SemanticTemplate {type: "substitution"} [
		SemanticConstant {value: TokenWorth(TEMPLATE_HEAD)} [],
		SemanticConstant {value: TokenWorth(TEMPLATE_TAIL)} [],
	];
Decorate(StringTemplate ::= TEMPLATE_HEAD Expression TEMPLATE_TAIL) -> SemanticTemplate
	:= SemanticTemplate {type: "substitution"} [
		SemanticConstant {value: TokenWorth(TEMPLATE_HEAD)} [],
		Decorate(Expression),
		SemanticConstant {value: TokenWorth(TEMPLATE_TAIL)} [],
	];
Decorate(StringTemplate ::= TEMPLATE_HEAD StringTemplate__0__List TEMPLATE_TAIL) -> SemanticTemplate
	:= SemanticTemplate {type: "substitution"} [
		SemanticConstant {value: TokenWorth(TEMPLATE_HEAD)} [],
		...Decorate(StringTemplate__0__List).children,
		SemanticConstant {value: TokenWorth(TEMPLATE_TAIL)} [],
	];
Decorate(StringTemplate ::= TEMPLATE_HEAD Expression StringTemplate__0__List TEMPLATE_TAIL) -> SemanticTemplate
	:= SemanticTemplate {type: "substitution"} [
		SemanticConstant {value: TokenWorth(TEMPLATE_HEAD)} [],
		Decorate(Expression),
		...Decorate(StringTemplate__0__List).children,
		SemanticConstant {value: TokenWorth(TEMPLATE_TAIL)} [],
	];

Decorate(StringTemplate__0__List ::= TEMPLATE_MIDDLE) -> SemanticTemplatePartial
	:= SemanticTemplatePartial {} [
		SemanticConstant {value: TokenWorth(TEMPLATE_MIDDLE)} [],
	];
Decorate(StringTemplate__0__List ::= TEMPLATE_MIDDLE Expression) -> SemanticTemplatePartial
	:= SemanticTemplatePartial {} [
		SemanticConstant {value: TokenWorth(TEMPLATE_MIDDLE)} [],
		Decorate(Expression),
	];
Decorate(StringTemplate__0__List ::= StringTemplate__0__List TEMPLATE_MIDDLE) -> SemanticTemplatePartial
	:= SemanticTemplatePartial {} [
		...Decorate(StringTemplate__0__List).children,
		SemanticConstant {value: TokenWorth(TEMPLATE_MIDDLE)} [],
	];
Decorate(StringTemplate__0__List ::= StringTemplate__0__List TEMPLATE_MIDDLE Expression) -> SemanticTemplatePartial
	:= SemanticTemplatePartial {} [
		...Decorate(StringTemplate__0__List).children,
		SemanticConstant {value: TokenWorth(TEMPLATE_MIDDLE)} [],
		Decorate(Expression),
	];
```


### Runtime Instructions: Evaluate (Literals)
```w3c
Evaluate(SemanticConstant) :=
	1. Push `SemanticConstant.value` onto the operand stack.
```



## Expression Units
```w3c
ExpressionUnit ::=
	| IDENTIFIER
	| PrimitiveLiteral
	| StringTemplate
	| "(" Expression ")"
;
```


### Static Semantics: Decorate (Expression Units)
```w3c
Decorate(ExpressionUnit ::= IDENTIFIER) -> SemanticIdentifier
	:= SemanticIdentifier {id: TokenWorth(IDENTIFIER)} [];
Decorate(ExpressionUnit ::= PrimitiveLiteral) -> SemanticConstant
	:= Decorate(PrimitiveLiteral);
Decorate(ExpressionUnit ::= StringTemplate) -> SemanticTemplate
	:= Decorate(StringTemplate);
Decorate(ExpressionUnit ::= "(" Expression ")") -> SemanticIdentifier | SemanticConstant | SemanticTemplate | SemanticExpression
	:= Decorate(Expression);
```


### Runtime Instructions: Evaluate (Expression Units)
```w3c
Evaluate(SemanticIdentifier) :=
	/* TO BE DETERMINED */
```



## Unary Operators
```w3c
ExpressionUnarySymbol ::= ExpressionUnit | ("+" | "-") ExpressionUnarySymbol;
```


### Static Semantics: Decorate (Unary Operators)
```w3c
Decorate(ExpressionUnarySymbol ::= ExpressionUnit) -> SemanticIdentifier | SemanticConstant | SemanticTemplate | SemanticExpression
	:= Decorate(ExpressionUnit);
Decorate(ExpressionUnarySymbol ::= "+" ExpressionUnarySymbol) -> SemanticIdentifier | SemanticConstant | SemanticTemplate | SemanticExpression
	:= Decorate(ExpressionUnarySymbol);
Decorate(ExpressionUnarySymbol ::= "-" ExpressionUnarySymbol) -> SemanticExpression
	:= SemanticExpression {operator: NEG} [
		Decorate(ExpressionUnarySymbol),
	];
```


### Runtime Instructions: Evaluate (Unary Operators)
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
ExpressionExponential ::= ExpressionUnarySymbol ("^" ExpressionExponential)?;
```


### Static Semantics: Decorate (Exponentiation)
```w3c
Decorate(ExpressionExponential ::= ExpressionUnarySymbol) -> SemanticIdentifier | SemanticConstant | SemanticTemplate | SemanticExpression
	:= Decorate(ExpressionUnarySymbol);
Decorate(ExpressionExponential ::= ExpressionUnarySymbol "^" ExpressionExponential) -> SemanticExpression
	:= SemanticExpression {operator: EXP} [
		Decorate(ExpressionUnarySymbol),
		Decorate(ExpressionExponential),
	];
```


### Runtime Instructions: Evaluate (Exponentiation)
```w3c
Evaluate(SemanticExpression[operator=EXP]) :=
	1. Assert:`SemanticExpression.children.count` is 2.
	2. Perform: `Evaluate(SemanticExpression.children.0)`.
	3. Perform: `Evaluate(SemanticExpression.children.1)`.
	4. Perform: `EvaluateNumericBinaryExpression(EXP)`
```



## Multiplicative
```w3c
ExpressionMultiplicative ::= (ExpressionMultiplicative ("*" | "/"))? ExpressionExponential;
```


### Static Semantics: Decorate (Multiplicative)
```w3c
Decorate(ExpressionMultiplicative ::= ExpressionExponential) -> SemanticIdentifier | SemanticConstant | SemanticTemplate | SemanticExpression
	:= Decorate(ExpressionExponential);
Decorate(ExpressionMultiplicative ::= ExpressionMultiplicative "*" ExpressionExponential) -> SemanticExpression
	:= SemanticExpression {operator: MUL} [
		Decorate(ExpressionMultiplicative),
		Decorate(ExpressionExponential),
	];
Decorate(ExpressionMultiplicative ::= ExpressionMultiplicative "/" ExpressionExponential) -> SemanticExpression
	:= SemanticExpression {operator: DIV} [
		Decorate(ExpressionMultiplicative),
		Decorate(ExpressionExponential),
	];
```


### Runtime Instructions: Evaluate (Multiplicative)
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
ExpressionAdditive ::= (ExpressionAdditive ("+" | "-"))? ExpressionMultiplicative;
```


### Static Semantics: Decorate (Additive)
```w3c
Decorate(ExpressionAdditive ::= ExpressionMultiplicative) -> SemanticIdentifier | SemanticConstant | SemanticTemplate | SemanticExpression
	:= Decorate(ExpressionMultiplicative);
Decorate(ExpressionAdditive ::= ExpressionAdditive "+" ExpressionMultiplicative) -> SemanticExpression
	:= SemanticExpression {operator: ADD} [
		Decorate(ExpressionAdditive),
		Decorate(ExpressionMultiplicative),
	];
Decorate(ExpressionAdditive ::= ExpressionAdditive "-" ExpressionMultiplicative) -> SemanticExpression
	:= SemanticExpression {operator: ADD} [
		Decorate(ExpressionAdditive),
		SemanticExpression {operator: NEG} [
			Decorate(ExpressionMultiplicative),
		],
	];
```


### Runtime Instructions: Evaluate (Additive)
```w3c
Evaluate(SemanticExpression[operator=ADD]) :=
	1. Assert: `SemanticExpression.children.count` is 2.
	2. Perform: `Evaluate(SemanticExpression.children.0)`.
	3. Perform: `Evaluate(SemanticExpression.children.1)`.
	4. Perform: `EvaluateNumericBinaryExpression(ADD)`
```
