# Solid Language: Expressions
This chapter defines the syntax, semantics, and behavior of expressions in the Solid programming language.

```w3c
Expression ::= ExpressionAdditive;
```


### Static Semantics: Semantic Schema (Expressions)
```w3c
SemanticExpression =:=
	| SemanticConstant
	| SemanticNodeIdentifier
	| SemanticNodeTemplate
	| SemanticNodeOperation
;
```


### Static Semantics: Decorate (Expressions)
```w3c
Decorate(Expression ::= ExpressionAdditive) -> SemanticExpression
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


### Abstract Operation: PerformNumericBinaryOperation
```w3c
Number PerformNumericBinaryOperation(Text op, Number operand0, Number operand1) :=
	1. *If* `op` is `EXP`:
		1. *Let* `result` be the power, `operand0 ^ operand1`,
			obtained by raising `operand0` (the base) to `operand1` (the exponent).
	2. *Else If* `op` is `MUL`:
		1. *Let* `result` be the product, `operand0 * operand1`,
			obtained by multiplying `operand0` (the multiplicand) by `operand1` (the multiplier).
	3. *Else If* `op` is `DIV`:
		1. *Let* `result` be the quotient, `operand0 / operand1`,
			obtained by dividing `operand0` (the dividend) by `operand1` (the divisor).
	4. *Else If* `op` is `ADD`:
		1. *Let* `result` be the sum, `operand0 + operand1`,
			obtained by adding `operand0` (the augend) to `operand1` (the addend).
	5. *Assert:* `TypeOf(result)` is `Number`.
	6. *Return:* `result`.
```


### AbstractOperation: AssessSemanticOperationBinary
```w3c
Or<Number, SemanticExpression> AssessSemanticOperationBinary(SemanticOperation expr) :=
	1. *Assert:* `expr.children.count` is 2.
	2. *Let* `operand0` be the result of performing `Assess(expr.children.0)`.
	3. *If* `TypeOf(operand0)` is `SemanticExpression`:
		1. *Return:* `expr`.
	4. *Let* `operand1` be the result of performing `Assess(expr.children.1)`.
	5. *If* `TypeOf(operand1)` is `SemanticExpression`:
		1. *Return:* `expr`.
	6. *Assert:* `TypeOf(operand0)` and `TypeOf(operand1)` are both `Number`.
	7. *Let* `result` be the result of performing `PerformNumericBinaryOperation(expr.operator, operand0, operand1)`.
	8. *Return:* `result`.
```


### Abstract Operation: BuildSemanticOperationBinary
```w3c
Sequence<Instruction> BuildSemanticOperationBinary(SemanticOperation expr) :=
	1. *Assert:* `expr.children.count` is 2.
	2. *Let* `instrs0` be the result of performing `Build(Assess(expr.children.0))`.
	3. *Let* `instrs1` be the result of performing `Build(Assess(expr.children.1))`.
	4. *Return:* <...instrs0, ...instrs1, "Perform stack operation `expr.operator`.">.
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


### Static Semantics: Semantic Schema (Literals)
```w3c
SemanticConstant[value: Number]
	::= ();

SemanticTemplate[type: "full"]
	::= SemanticConstant;
SemanticTemplate[type: "substitution"]
	::= (SemanticConstant SemanticExpression?)+ SemanticConstant;

SemanticTemplatePartial
	::= (SemanticConstant SemanticExpression?)+;
```


### Static Semantics: Decorate (Literals)
```w3c
Decorate(PrimitiveLiteral ::= NUMBER) -> SemanticConstant
	:= (SemanticConstant[value=TokenWorth(NUMBER));

Decorate(PrimitiveLiteral ::= STRING) -> SemanticConstant
	:= (SemanticConstant[value=TokenWorth(STRING)]);

Decorate(StringTemplate ::= TEMPLATE_FULL) -> SemanticTemplate
	:= (SemanticTemplate[type="full"]
		(SemanticConstant[value=TokenWorth(TEMPLATE_FULL)])
	);
Decorate(StringTemplate ::= TEMPLATE_HEAD TEMPLATE_TAIL) -> SemanticTemplate
	:= (SemanticTemplate[type="substitution"]
		(SemanticConstant[value=TokenWorth(TEMPLATE_HEAD)])
		(SemanticConstant[value=TokenWorth(TEMPLATE_TAIL)])
	);
Decorate(StringTemplate ::= TEMPLATE_HEAD Expression TEMPLATE_TAIL) -> SemanticTemplate
	:= (SemanticTemplate[type="substitution"]
		(SemanticConstant[value=TokenWorth(TEMPLATE_HEAD)])
		Decorate(Expression)
		(SemanticConstant[value=TokenWorth(TEMPLATE_TAIL)])
	);
Decorate(StringTemplate ::= TEMPLATE_HEAD StringTemplate__0__List TEMPLATE_TAIL) -> SemanticTemplate
	:= (SemanticTemplate[type="substitution"]
		(SemanticConstant[value=TokenWorth(TEMPLATE_HEAD)])
		...Decorate(StringTemplate__0__List)
		(SemanticConstant[value=TokenWorth(TEMPLATE_TAIL)])
	);
Decorate(StringTemplate ::= TEMPLATE_HEAD Expression StringTemplate__0__List TEMPLATE_TAIL) -> SemanticTemplate
	:= (SemanticTemplate[type="substitution"]
		(SemanticConstant[value=TokenWorth(TEMPLATE_HEAD)])
		Decorate(Expression)
		...Decorate(StringTemplate__0__List)
		(SemanticConstant[value=TokenWorth(TEMPLATE_TAIL)])
	);

Decorate(StringTemplate__0__List ::= TEMPLATE_MIDDLE) -> Sequence<SemanticConstant, SemanticExpression?>
	:= (SemanticTemplatePartial
		(SemanticConstant[value=TokenWorth(TEMPLATE_MIDDLE)])
	);
Decorate(StringTemplate__0__List ::= TEMPLATE_MIDDLE Expression) -> Sequence<SemanticConstant, SemanticExpression?>
	:= (SemanticTemplatePartial
		(SemanticConstant[value=TokenWorth(TEMPLATE_MIDDLE)])
		Decorate(Expression)
	);
Decorate(StringTemplate__0__List ::= StringTemplate__0__List TEMPLATE_MIDDLE) -> Sequence<SemanticConstant, SemanticExpression?>
	:= (SemanticTemplatePartial
		...Decorate(StringTemplate__0__List)
		(SemanticConstant[value=TokenWorth(TEMPLATE_MIDDLE)])
	);
Decorate(StringTemplate__0__List ::= StringTemplate__0__List TEMPLATE_MIDDLE Expression) -> Sequence<SemanticConstant, SemanticExpression?>
	:= (SemanticTemplatePartial
		...Decorate(StringTemplate__0__List)
		(SemanticConstant[value=TokenWorth(TEMPLATE_MIDDLE)])
		Decorate(Expression)
	);
```


### Static Semantics: Assess (Literals)
```w3c
Number Assess(SemanticConstant const) :=
	1. *Return:* `const.value`.

Void Assess(SemanticTemplate tpl) :=
	/* TO BE DETERMINED */
```


### Static Semantics: Build (Literals)
```w3c
Sequence<Instruction> Build(Number n) :=
	1. *Return:* <"Push `n` onto the operand stack.">.

Sequence<Instruction> Build(SemanticConstant const) :=
	1. *Return:* `Build(Assess(const))`.

Void Build(SemanticTemplate tpl) :=
	/* TO BE DETERMINED */
```


### Runtime Instructions: Evaluate (Literals)
```w3c
Void Evaluate(Instruction :::= "Push `value` onto the operand stack.", Number value) :=
	1. Push `value` onto the operand stack.
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


### Static Semantics: Semantic Schema (Expression Units)
```w3c
SemanticIdentifier[id: Number]
	::= ();
```


### Static Semantics: Decorate (Expression Units)
```w3c
Decorate(ExpressionUnit ::= IDENTIFIER) -> SemanticIdentifier
	:= (SemanticIdentifier[id=TokenWorth(IDENTIFIER)]);
Decorate(ExpressionUnit ::= PrimitiveLiteral) -> SemanticConstant
	:= Decorate(PrimitiveLiteral);
Decorate(ExpressionUnit ::= StringTemplate) -> SemanticTemplate
	:= Decorate(StringTemplate);
Decorate(ExpressionUnit ::= "(" Expression ")") -> SemanticExpression
	:= Decorate(Expression);
```


### Static Semantics: Assess (Expression Units)
```w3c
Number Assess(SemanticIdentifier iden) :=
	/* TO BE DETERMINED */
```


### Static Semantics: Build (Expression Units)
```w3c
Sequence<Instruction> Build(SemanticIdentifier iden) :=
	/* TO BE DETERMINED */
```


### Runtime Instructions: Evaluate (Expression Units)
```w3c
Void Evaluate(SemanticIdentifier iden) :=
	/* TO BE DETERMINED */
```



## Unary Operators
```w3c
ExpressionUnarySymbol ::= ExpressionUnit | ("+" | "-") ExpressionUnarySymbol;
```


### Static Semantics: Semantic Schema (Unary Operators)
```w3c
SemanticOperation[operator: NEG]
	::= SemanticExpression;
```


### Static Semantics: Decorate (Unary Operators)
```w3c
Decorate(ExpressionUnarySymbol ::= ExpressionUnit) -> SemanticExpression
	:= Decorate(ExpressionUnit);
Decorate(ExpressionUnarySymbol ::= "+" ExpressionUnarySymbol) -> SemanticExpression
	:= Decorate(ExpressionUnarySymbol);
Decorate(ExpressionUnarySymbol ::= "-" ExpressionUnarySymbol) -> SemanticOperation
	:= (SemanticOperation[operator=NEG] Decorate(ExpressionUnarySymbol));
```


### Static Semantics: Assess (Unary Operators)
```w3c
Or<Number, SemanticExpression> Assess(SemanticOperation[operator=NEG] expr) :=
	1. *Assert:* `expr.children.count` is 1.
	2. *Let* `operand` be the result of performing `Assess(expr.children.0)`.
	3. *If* `TypeOf(operand)` is `SemanticExpression`:
		1. *Return:* `expr`.
	4. *Assert:* `TypeOf(operand)` is `Number`.
	5. *Let* `negation` be the additive inverse, `-operand`,
		obtained by negating `operand`.
	6. *Return:* `negation`.
```


### Static Semantics: Build (Unary Operators)
```w3c
Sequence<Instruction> Build(SemanticOperation[operator=NEG] expr) :=
	1. *Assert:* `expr.children.count` is 1.
	2. *Let* `instrs` be the result of performing `Build(Assess(expr.children.0))`.
	3. *Return:* <...instrs, "Perform stack operation NEG.">.
```


### Runtime Instructions: Evaluate (Unary Operators)
```w3c
Void Evaluate(Instruction :::= "Perform stack operation NEG.") :=
	1. Pop `operand` from the operand stack.
	2. *Let* `negation` be the additive inverse, `-operand`,
		obtained by negating `operand`.
	3. Push `negation` onto the operand stack.
```



## Exponentiation
```w3c
ExpressionExponential ::= ExpressionUnarySymbol ("^" ExpressionExponential)?;
```


### Static Semantics: Semantic Schema (Exponentiation)
```w3c
SemanticOperation[operator: EXP]
	::= SemanticExpression SemanticExpression;
```


### Static Semantics: Decorate (Exponentiation)
```w3c
Decorate(ExpressionExponential ::= ExpressionUnarySymbol) -> SemanticExpression
	:= Decorate(ExpressionUnarySymbol);
Decorate(ExpressionExponential ::= ExpressionUnarySymbol "^" ExpressionExponential) -> SemanticOperation
	:= (SemanticOperation[operator=EXP]
		Decorate(ExpressionUnarySymbol)
		Decorate(ExpressionExponential)
	);
```


### Static Semantics: Assess (Exponentiation)
```w3c
Or<Number, SemanticExpression> Assess(SemanticOperation[operator=EXP] expr) :=
	1. *Return:* `AssessSemanticOperationBinary(expr)`.
```


### Static Semantics: Build (Exponentiation)
```w3c
Sequence<Instruction> Build(SemanticOperation[operator=EXP] expr) :=
	1. *Return:* `BuildSemanticOperationBinary(expr)`.
```


### Runtime Instructions: Evaluate (Exponentiation)
```w3c
Void Evaluate(Instruction :::= "Perform stack operation EXP.") :=
	1. Pop `operand1` from the operand stack.
	2. Pop `operand0` from the operand stack.
	3. *Let* `power` be the result of performing `PerformNumericBinaryOperation(EXP, operand0, operand1)`.
	4. Push `power` onto the operand stack.
```



## Multiplicative
```w3c
ExpressionMultiplicative ::= (ExpressionMultiplicative ("*" | "/"))? ExpressionExponential;
```


### Static Semantics: Semantic Schema (Multiplicative)
```w3c
SemanticOperation[operator: MUL | DIV]
	::= SemanticExpression SemanticExpression;
```


### Static Semantics: Decorate (Multiplicative)
```w3c
Decorate(ExpressionMultiplicative ::= ExpressionExponential) -> SemanticExpression
	:= Decorate(ExpressionExponential);
Decorate(ExpressionMultiplicative ::= ExpressionMultiplicative "*" ExpressionExponential) -> SemanticOperation
	:= (SemanticOperation[operator=MUL]
		Decorate(ExpressionMultiplicative)
		Decorate(ExpressionExponential)
	);
Decorate(ExpressionMultiplicative ::= ExpressionMultiplicative "/" ExpressionExponential) -> SemanticOperation
	:= (SemanticOperation[operator=DIV]
		Decorate(ExpressionMultiplicative)
		Decorate(ExpressionExponential)
	);
```


### Static Semantics: Assess (Multiplicative)
```w3c
Or<Number, SemanticExpression> Assess(SemanticOperation[operator=MUL|DIV] expr) :=
	1. *Return:* `AssessSemanticOperationBinary(expr)`.
```


### Static Semantics: Build (Multiplicative)
```w3c
Sequence<Instruction> Build(SemanticOperation[operator=MUL|DIV] expr) :=
	1. *Return:* `BuildSemanticOperationBinary(expr)`.
```


### Runtime Instructions: Evaluate (Multiplicative)
```w3c
Void Evaluate(Instruction :::= "Perform stack operation MUL.") :=
	1. Pop `operand1` from the operand stack.
	2. Pop `operand0` from the operand stack.
	3. *Let* `product` be the result of performing `PerformNumericBinaryOperation(MUL, operand0, operand1)`.
	4. Push `product` onto the operand stack.
Void Evaluate(Instruction :::= "Perform stack operation DIV.") :=
	1. Pop `operand1` from the operand stack.
	2. Pop `operand0` from the operand stack.
	3. *Let* `quotient` be the result of performing `PerformNumericBinaryOperation(DIV, operand0, operand1)`.
	4. Push `quotient` onto the operand stack.
```



## Additive
```w3c
ExpressionAdditive ::= (ExpressionAdditive ("+" | "-"))? ExpressionMultiplicative;
```


### Static Semantics: Semantic Schema (Additive)
```w3c
SemanticOperation[operator: ADD]
	::= SemanticExpression SemanticExpression;
```


### Static Semantics: Decorate (Additive)
```w3c
Decorate(ExpressionAdditive ::= ExpressionMultiplicative) -> SemanticExpression
	:= Decorate(ExpressionMultiplicative);
Decorate(ExpressionAdditive ::= ExpressionAdditive "+" ExpressionMultiplicative) -> SemanticOperation
	:= (SemanticOperation[operator=ADD]
		Decorate(ExpressionAdditive)
		Decorate(ExpressionMultiplicative)
	);
Decorate(ExpressionAdditive ::= ExpressionAdditive "-" ExpressionMultiplicative) -> SemanticOperation
	:= (SemanticOperation[operator=ADD]
		Decorate(ExpressionAdditive)
		(SemanticOperation[operator=NEG] Decorate(ExpressionMultiplicative))
	);
```


### Static Semantics: Assess (Additive)
```w3c
Or<Number, SemanticExpression> Assess(SemanticOperation[operator=ADD] expr) :=
	1. *Return:* `AssessSemanticOperationBinary(expr)`.
```


### Static Semantics: Build (Additive)
```w3c
Sequence<Instruction> Build(SemanticOperation[operator=ADD] expr) :=
	1. *Return:* `BuildSemanticOperationBinary(expr)`.
```


### Runtime Instructions: Evaluate (Additive)
```w3c
Void Evaluate(Instruction :::= "Perform stack operation ADD.") :=
	1. Pop `operand1` from the operand stack.
	2. Pop `operand0` from the operand stack.
	3. *Let* `sum` be the result of performing `PerformNumericBinaryOperation(ADD, operand0, operand1)`.
	4. Push `sum` onto the operand stack.
```
