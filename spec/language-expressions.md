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


### AbstractOperation: AssessNumericBinaryExpression
```w3c
Or<Number, Null> AssessNumericBinaryExpression(SemanticExpression expr) :=
	1. *Assert:* `expr.children.count` is 2.
	2. *Let* `operand0` be the result of performing `Assess(expr.children.0)`.
	3. *If* `Type(operand0)` is `Null`:
		1. *Return:* `Null`.
	4. *Let* `operand1` be the result of performing `Assess(expr.children.1)`.
	5. *If* `Type(operand1)` is `Null`:
		1. *Return:* `Null`.
	6. *Assert:* `Type(operand0)` and `Type(operand1)` are both `Number`.
	7. *Let* `result` be the result of performing `EvaluateNumericBinaryExpression(expr.operator, operand0, operand1)`.
	8. *Return:* `result`.
```


### Abstract Operation: BuildNumericBinaryExpression
```w3c
Sequence<Instruction> BuildNumericBinaryExpression(SemanticExpression expr) :=
	1. *Let* `assess` be the result of performing `Assess(expr)`.
	2. *If* `Type(assess)` is `Number`:
		1. *Return:* <"Push `assess` onto the operand stack.">.
	3. *Else:*
		1. *Assert:* `Type(assess)` is `Null`.
		2. *Assert:* `SemanticExpression.children.count` is 2.
		3. *Let* `instr0` be the result of performing `Build(expr.children.0)`.
		4. *Let* `instr1` be the result of performing `Build(expr.children.1)`.
		5. *Return:* <instr0, instr1, "Perform stack operation `expr.operator`.">.
```


### Abstract Operation: EvaluateNumericBinaryExpression
```w3c
EvaluateNumericBinaryExpression(op, operand1, operand2) :=
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


### Static Semantics: Assess (Expression Units)
```w3c
Number Assess(SemanticConstant const) :=
	1. *Return:* `const.value`.
```


### Static Semantics: Build (Expression Units)
```w3c
Sequence<Instruction> Build(SemanticExpression[operator=MUL] expr) :=
	1. *Let* `assess` be the result of performing `Assess(expr)`.
	2. *Return:* <"Push `assess` onto the operand stack.">.
```


### Runtime Instructions: Evaluation (Expression Units)
```w3c
Void Evaluate(Instruction :::= "Push `value` onto the operand stack.", Number value) :=
	1. Push `value` onto the operand stack.
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


### Static Semantics: Assess (Unary Operators)
```w3c
Or<Number, Null> Assess(SemanticExpression expr) :=
	1. *Assert:* `expr.children.count` is 1.
	2. *Let* `operand` be the result of performing `Assess(expr.children.0)`.
	3. *If* `Type(operand)` is `Null`:
		1. *Return:* `Null`.
	4. *Assert:* `Type(operand)` is `Number`.
	5. *Let* `negation` be the additive inverse, `-operand`,
		obtained by negating `operand`.
	6. *Return* `negation`.
```


### Static Semantics: Build (Unary Operators)
```w3c
Sequence<Instruction> Build(SemanticExpression[operator=NEG] expr) :=
	1. *Let* `assess` be the result of performing `Assess(expr)`.
	2. *If* `Type(assess)` is `Number`:
		1. *Return:* <"Push `assess` onto the operand stack.">.
	3. *Else:*
		1. *Assert:* `Type(assess)` is `Null`.
		2. *Assert:* `SemanticExpression.children.count` is 1.
		3. *Let* `instr0` be the result of performing `Build(expr.children.0)`.
		4. *Return:* <instr0, "Perform stack operation NEG.">.
```


### Runtime Instructions: Evaluation (Unary Operators)
```w3c
Void Evaluate(Instruction :::= "Perform stack operation NEG.") :=
	1. Pop `operand` from the operand stack.
	2. *Let* `negation` be the additive inverse, `-operand`,
		obtained by negating `operand`.
	3. Push `negation` onto the operand stack.
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


### Static Semantics: Assess (Exponentiation)
```w3c
Or<Number, Null> Assess(SemanticExpression[operator=EXP] expr) :=
	1. *Let* `power` be the result of performing `AssessNumericBinaryExpression(expr)`.
	2. *Return:* `power`.
```


### Static Semantics: Build (Exponentiation)
```w3c
Sequence<Instruction> Build(SemanticExpression[operator=EXP] expr) :=
	1. *Let* `build` be the result of performing `BuildNumericBinaryExpression(expr)`.
	2. *Return:* `build`.
```


### Runtime Instructions: Evaluation (Exponentiation)
```w3c
Void Evaluate(Instruction :::= "Perform stack operation EXP.") :=
	1. Pop `operand1` from the operand stack.
	2. Pop `operand0` from the operand stack.
	3. *Let* `power` be the result of performing `EvaluateNumericBinaryExpression(EXP, operand0, operand1)`.
	4. Push `power` onto the operand stack.
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


### Static Semantics: Assess (Multiplication/Division)
```w3c
Or<Number, Null> Assess(SemanticExpression[operator=MUL] expr) :=
	1. *Let* `product` be the result of performing `AssessNumericBinaryExpression(expr)`.
	2. *Return* `product`.
Or<Number, Null> Assess(SemanticExpression[operator=DIV] expr) :=
	1. *Let* `quotient` be the result of performing `AssessNumericBinaryExpression(expr)`.
	2. *Return* `quotient`.
```


### Static Semantics: Build (Multiplication/Division)
```w3c
Sequence<Instruction> Build(SemanticExpression[operator=MUL] expr) :=
	1. *Let* `build` be the result of performing `BuildNumericBinaryExpression(expr)`.
	2. *Return:* `build`.
Sequence<Instruction> Build(SemanticExpression[operator=DIV] expr) :=
	1. *Let* `build` be the result of performing `BuildNumericBinaryExpression(expr)`.
	2. *Return:* `build`.
```


### Runtime Instructions: Evaluation (Multiplication/Division)
```w3c
Void Evaluate(Instruction :::= "Perform stack operation MUL.") :=
	1. Pop `operand1` from the operand stack.
	2. Pop `operand0` from the operand stack.
	3. *Let* `product` be the result of performing `EvaluateNumericBinaryExpression(MUL, operand0, operand1)`.
	4. Push `product` onto the operand stack.
Void Evaluate(Instruction :::= "Perform stack operation DIV.") :=
	1. Pop `operand1` from the operand stack.
	2. Pop `operand0` from the operand stack.
	3. *Let* `quotient` be the result of performing `EvaluateNumericBinaryExpression(DIV, operand0, operand1)`.
	4. Push `quotient` onto the operand stack.
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


### Static Semantics: Assess (Addition/Subtraction)
```w3c
Or<Number, Null> Assess(SemanticExpression[operator=ADD] expr) :=
	1. *Let* `sum` be the result of performing `AssessNumericBinaryExpression(expr)`.
	2. *Return* `sum`.
```


### Static Semantics: Build (Addition/Subtraction)
```w3c
Sequence<Instruction> Build(SemanticExpression[operator=ADD] expr) :=
	1. *Let* `build` be the result of performing `BuildNumericBinaryExpression(expr)`.
	2. *Return:* `build`.
```


### Runtime Instructions: Evaluation (Addition/Subtraction)
```w3c
Void Evaluate(Instruction :::= "Perform stack operation ADD.") :=
	1. Pop `operand1` from the operand stack.
	2. Pop `operand0` from the operand stack.
	3. *Let* `sum` be the result of performing `EvaluateNumericBinaryExpression(ADD, operand0, operand1)`.
	4. Push `sum` onto the operand stack.
```
