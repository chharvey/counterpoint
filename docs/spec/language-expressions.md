# Solid Language: Expressions
This chapter defines the syntax, semantics, and behavior of expressions in the Solid programming language.

```w3c
Expression ::= ExpressionAdditive;
```


### Static Semantics: Decorate (Expressions)
```w3c
Decorate(Expression ::= ExpressionAdditive) -> SemanticIdentifier | SemanticConstant | SemanticTemplate | SemanticOperation
	:= Decorate(ExpressionAdditive);
```


### Abstract Operation: TypeOf
The abstract operation `TypeOf` returns the [Solid Language Type] of an expression.
```
Type typeOf(SemanticConstant constant) :=
	1. If `constant.value` is a `RealNumber`:
		1. Return: `Number`.
	2. Else:
		1. Assert: `constant.value` is a `Sequence<RealNumber>`.
		2. Return: `String`.

Type typeOf(StringTemplate template) :=
	1. Return: `String`.

Type typeOf(SemanticIdentifier id) :=
	/* TO BE DETERMINED */

Type typeOf(SemanticOperation operation) :=
	1. If `typeOf(operation.children.0)` is `Number`:
		1. If `operation.children.count` is 1:
			1. Return: `Number`.
		2. Else:
			1. Assert: `operation.children.count` is 2.
			2. If `typeOf(operation.children.1)` is `Number`:
				1. Return: `Number`.
	2. Throw a TypeError "Invalid operation.".
```


### Abstract Operation: EvaluateNumericBinaryExpression
The abstract operation `EvaluateNumericBinaryExpression` performs a binary stack operation.
```w3c
Void EvaluateNumericBinaryExpression(Text op, operand1, operand2) :=
	1. *Let* `operation` be a function obtained from the following record, keyed by `op`: {
		`ADD`: Return the sum, `arg1 + arg2`,
			obtained by adding `arg1` (the augend) to `arg2` (the addend).
		`MUL`: Return the product, `arg1 * arg2`,
			obtained by multiplying `arg1` (the multiplicand) by `arg2` (the multiplier).
		`DIV`: Return the quotient, `arg1 / arg2`,
			obtained by dividing `arg1` (the dividend) by `arg2` (the divisor).
		`EXP`: Return the power, `arg1 ^ arg2`,
				obtained by raising `arg1` (the base) to `arg2` (the exponent).
	}
	2. *Return* `operation(operand1, operand2)`.
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
		...Decorate(StringTemplate__0__List),
		SemanticConstant {value: TokenWorth(TEMPLATE_TAIL)} [],
	];
Decorate(StringTemplate ::= TEMPLATE_HEAD Expression StringTemplate__0__List TEMPLATE_TAIL) -> SemanticTemplate
	:= SemanticTemplate {type: "substitution"} [
		SemanticConstant {value: TokenWorth(TEMPLATE_HEAD)} [],
		Decorate(Expression),
		...Decorate(StringTemplate__0__List),
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
		...Decorate(StringTemplate__0__List),
		SemanticConstant {value: TokenWorth(TEMPLATE_MIDDLE)} [],
	];
Decorate(StringTemplate__0__List ::= StringTemplate__0__List TEMPLATE_MIDDLE Expression) -> SemanticTemplatePartial
	:= SemanticTemplatePartial {} [
		...Decorate(StringTemplate__0__List),
		SemanticConstant {value: TokenWorth(TEMPLATE_MIDDLE)} [],
		Decorate(Expression),
	];
```


### Runtime Instructions: Evaluate (Literals)
```w3c
Evaluate(SemanticConstant) :=
	1. *Return* `SemanticConstant.value`.
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
Decorate(ExpressionUnit ::= "(" Expression ")") -> SemanticIdentifier | SemanticConstant | SemanticTemplate | SemanticOperation
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
Decorate(ExpressionUnarySymbol ::= ExpressionUnit) -> SemanticIdentifier | SemanticConstant | SemanticTemplate | SemanticOperation
	:= Decorate(ExpressionUnit);
Decorate(ExpressionUnarySymbol ::= "+" ExpressionUnarySymbol) -> SemanticIdentifier | SemanticConstant | SemanticTemplate | SemanticOperation
	:= Decorate(ExpressionUnarySymbol);
Decorate(ExpressionUnarySymbol ::= "-" ExpressionUnarySymbol) -> SemanticOperation
	:= SemanticOperation {operator: NEG} [
		Decorate(ExpressionUnarySymbol),
	];
```


### Runtime Instructions: Evaluate (Unary Operators)
```w3c
Evaluate(SemanticOperation[operator=NEG]) :=
	1. *Assert:* `SemanticExpression.children.count` is 1.
	2. *Let* `operand` be the result of performing `Evaluate(SemanticExpression.children.0)`.
	3. *Let* `negation` be the additive inverse, `-operand`,
		obtained by negating `operand`.
	4. *Return* `negation`.
```



## Exponentiation
```w3c
ExpressionExponential ::= ExpressionUnarySymbol ("^" ExpressionExponential)?;
```


### Static Semantics: Decorate (Exponentiation)
```w3c
Decorate(ExpressionExponential ::= ExpressionUnarySymbol) -> SemanticIdentifier | SemanticConstant | SemanticTemplate | SemanticOperation
	:= Decorate(ExpressionUnarySymbol);
Decorate(ExpressionExponential ::= ExpressionUnarySymbol "^" ExpressionExponential) -> SemanticOperation
	:= SemanticOperation {operator: EXP} [
		Decorate(ExpressionUnarySymbol),
		Decorate(ExpressionExponential),
	];
```


### Runtime Instructions: Evaluate (Exponentiation)
```w3c
Evaluate(SemanticOperation[operator=EXP]) :=
	1. *Assert:* `SemanticExpression.children.count` is 2.
	2. *Let* `operand1` be the result of performing `Evaluate(SemanticExpression.children.0)`.
	3. *Let* `operand2` be the result of performing `Evaluate(SemanticExpression.children.1)`.
	4. *Let* `power` be the result of performing `EvaluateNumericBinaryExpression(EXP, operand1, operand2)`.
	5. *Return* `power`.
```



## Multiplicative
```w3c
ExpressionMultiplicative ::= (ExpressionMultiplicative ("*" | "/"))? ExpressionExponential;
```


### Static Semantics: Decorate (Multiplicative)
```w3c
Decorate(ExpressionMultiplicative ::= ExpressionExponential) -> SemanticIdentifier | SemanticConstant | SemanticTemplate | SemanticOperation
	:= Decorate(ExpressionExponential);
Decorate(ExpressionMultiplicative ::= ExpressionMultiplicative "*" ExpressionExponential) -> SemanticOperation
	:= SemanticOperation {operator: MUL} [
		Decorate(ExpressionMultiplicative),
		Decorate(ExpressionExponential),
	];
Decorate(ExpressionMultiplicative ::= ExpressionMultiplicative "/" ExpressionExponential) -> SemanticOperation
	:= SemanticOperation {operator: DIV} [
		Decorate(ExpressionMultiplicative),
		Decorate(ExpressionExponential),
	];
```


### Runtime Instructions: Evaluate (Multiplicative)
```w3c
Evaluate(SemanticOperation[operator=MUL]) :=
	1. *Assert:* `SemanticExpression.children.count` is 2.
	2. *Let* `operand1` be the result of performing `Evaluate(SemanticExpression.children.0)`.
	3. *Let* `operand2` be the result of performing `Evaluate(SemanticExpression.children.1)`.
	4. *Let* `product` be the result of performing `EvaluateNumericBinaryExpression(MUL, operand1, operand2)`.
	5. *Return* `product`.
Evaluate(SemanticOperation[operator=DIV]) :=
	1. *Assert:* `SemanticExpression.children.count` is 2.
	2. *Let* `operand1` be the result of performing `Evaluate(SemanticExpression.children.0)`.
	3. *Let* `operand2` be the result of performing `Evaluate(SemanticExpression.children.1)`.
	4. *Let* `quotient` be the result of performing `EvaluateNumericBinaryExpression(DIV, operand1, operand2)`.
	5. *Return* `quotient`.
```



## Additive
```w3c
ExpressionAdditive ::= (ExpressionAdditive ("+" | "-"))? ExpressionMultiplicative;
```


### Static Semantics: Decorate (Additive)
```w3c
Decorate(ExpressionAdditive ::= ExpressionMultiplicative) -> SemanticIdentifier | SemanticConstant | SemanticTemplate | SemanticOperation
	:= Decorate(ExpressionMultiplicative);
Decorate(ExpressionAdditive ::= ExpressionAdditive "+" ExpressionMultiplicative) -> SemanticOperation
	:= SemanticOperation {operator: ADD} [
		Decorate(ExpressionAdditive),
		Decorate(ExpressionMultiplicative),
	];
Decorate(ExpressionAdditive ::= ExpressionAdditive "-" ExpressionMultiplicative) -> SemanticOperation
	:= SemanticOperation {operator: ADD} [
		Decorate(ExpressionAdditive),
		SemanticOperation {operator: NEG} [
			Decorate(ExpressionMultiplicative),
		],
	];
```


### Runtime Instructions: Evaluate (Additive)
```w3c
Evaluate(SemanticOperation[operator=ADD]) :=
	1. *Assert:* `SemanticExpression.children.count` is 2.
	2. *Let* `operand1` be the result of performing `Evaluate(SemanticExpression.children.0)`.
	3. *Let* `operand2` be the result of performing `Evaluate(SemanticExpression.children.1)`.
	4. *Let* `sum` be the result of performing `EvaluateNumericBinaryExpression(ADD, operand1, operand2)`.
	5. *Return* `sum`.
```
