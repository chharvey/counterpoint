# Solid Language: Expressions
This chapter defines the syntax, semantics, and behavior of expressions in the Solid programming language.

```
Expression ::=
	| ExpressionAdditive
	| ExpressionConditional
;
```


### Static Semantics: Semantic Schema (Expressions)
```
SemanticExpression =:=
	| SemanticConstant
	| SemanticIdentifier
	| SemanticTemplate
	| SemanticOperation
;
```


### Static Semantics: Decorate (Expressions)
```
Decorate(Expression ::= ExpressionAdditive) -> SemanticExpression
	:= Decorate(ExpressionAdditive);
```


### Abstract Operation: PerformNumericBinaryOperation
```
RealNumber PerformNumericBinaryOperation(Text op, RealNumber operand0, RealNumber operand1) :=
	1. *If* `op` is `EXP`:
		1. *Let* `result` be the power, `operand0 ^ operand1`,
			obtained by raising `operand0` (the base) to `operand1` (the exponent).
		2. *Return:* `result`.
	2. *Else If* `op` is `MUL`:
		1. *Let* `result` be the product, `operand0 * operand1`,
			obtained by multiplying `operand0` (the multiplicand) by `operand1` (the multiplier).
		2. *Return:* `result`.
	3. *Else If* `op` is `DIV`:
		1. *Let* `result` be the quotient, `operand0 / operand1`,
			obtained by dividing `operand0` (the dividend) by `operand1` (the divisor).
		2. *Return:* `result`.
	4. *Else If* `op` is `ADD`:
		1. *Let* `result` be the sum, `operand0 + operand1`,
			obtained by adding `operand0` (the augend) to `operand1` (the addend).
		2. *Return:* `result`.
	5. *Throw:* TypeError "Invalid operation.".
```


### AbstractOperation: AssessSemanticOperationBinary
```
Or<Integer, Float>? AssessSemanticOperationBinary(SemanticOperation expr) :=
	1. *Assert:* `expr.children.count` is 2.
	2. *Let* `operand0` be the result of performing `Assess(expr.children.0)`.
	3. *If* `TypeOf(operand0)` is `Void`:
		1. *Return*.
	4. *Let* `operand1` be the result of performing `Assess(expr.children.1)`.
	5. *If* `TypeOf(operand1)` is `Void`:
		1. *Return*.
	6. *If* `TypeOf(operand0)` is `Integer` *and* `TypeOf(operand1)` is `Integer`:
		1. *Return:* `Integer(PerformNumericBinaryOperation(expr.operator, operand0, operand1))`.
	7. *Assert*: `IsNumeric(operand0)` *and* `IsNumeric(operand1)`.
	8. *Let* `float0` be the type-conversion of `operand0` into type `Float`.
	9. *Let* `float1` be the type-conversion of `operand1` into type `Float`.
	10. *Return:* `Float(PerformNumericBinaryOperation(expr.operator, float0, float1))`.
```


### Abstract Operation: BuildSemanticOperationBinary
```
Sequence<Instruction> BuildSemanticOperationBinary(SemanticOperation expr) :=
	1. *Assert:* `expr.children.count` is 2.
	2. *Let* `assess0` be the result of performing `Assess(expr.children.0)`.
	3. *If* `TypeOf(assess0)` is `Void`:
		1. *Let* `instrs0` be the result of performing `Build(expr.children.0)`.
	4. *Else*:
		1. *Let* `instrs0` be the result of performing `Build(assess0)`.
	5. *Let* `assess1` be the result of performing `Assess(expr.children.1)`.
	6. *If* `TypeOf(assess1)` is `Void`:
		1. *Let* `instrs1` be the result of performing `Build(expr.children.1)`.
	7. *Else*:
		1. *Let* `instrs1` be the result of performing `Build(assess1)`.
	8. *Return:* [...instrs0, ...instrs1, "Perform stack operation `expr.operator`."].
```



## Literals
```
PrimitiveLiteral ::=
	| "null"
	| "false"
	| "true"
	| INTEGER
	| FLOAT
	| STRING
;

StringTemplate ::=
	| TEMPLATE_FULL
	| TEMPLATE_HEAD Expression? (TEMPLATE_MIDDLE Expression?)* TEMPLATE_TAIL
;
```


### Static Semantics: Semantic Schema (Literals)
```
SemanticConstant[value: Null | Boolean | Integer | FLoat | Sequence<RealNumber>]
	::= ();

SemanticTemplate[type: "full"]
	::= SemanticConstant;
SemanticTemplate[type: "substitution"]
	::= (SemanticConstant SemanticExpression?)+ SemanticConstant;

SemanticTemplatePartial
	::= (SemanticConstant SemanticExpression?)+;
```


### Static Semantics: Decorate (Literals)
```
Decorate(PrimitiveLiteral ::= "null") -> SemanticConstant
	:= (SemanticConstant[value=null]);

Decorate(PrimitiveLiteral ::= "false") -> SemanticConstant
	:= (SemanticConstant[value=false]);
Decorate(PrimitiveLiteral ::= "true") -> SemanticConstant
	:= (SemanticConstant[value=true]);

Decorate(PrimitiveLiteral ::= INTEGER) -> SemanticConstant
	:= (SemanticConstant[value=Integer(TokenWorth(INTEGER))]);

Decorate(PrimitiveLiteral ::= FLOAT) -> SemanticConstant
	:= (SemanticConstant[value=Float(TokenWorth(FLOAT))]);

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
```
Or<Null, Boolean, Integer, Float> Assess(SemanticConstant const) :=
	1. *Return:* `const.value`.

Void Assess(SemanticTemplate tpl) :=
	/* TO BE DETERMINED */
```


### Static Semantics: Build (Literals)
```
Sequence<Instruction> Build(Null n) :=
	1. *Return:* ["Push `0` onto the operand stack."].

Sequence<Instruction> Build(Boolean b) :=
	1. *If* `b` is `true`:
		1. *Return:* ["Push `1` onto the operand stack."].
	2. *Assert:* `b` is `false`.
	3. *Return:* ["Push `0` onto the operand stack."].

Sequence<Instruction> Build(Or<Integer, Float> n) :=
	1. *Return:* ["Push `n` onto the operand stack."].

Sequence<Instruction> Build(SemanticConstant const) :=
	1. *Return:* `Build(Assess(const))`.

Void Build(SemanticTemplate tpl) :=
	/* TO BE DETERMINED */
```


### Runtime Instructions: Evaluate (Literals)
```
Void Evaluate(Instruction :::= "Push `value` onto the operand stack.", Or<Integer, Float> value) :=
	1. Push `value` onto the operand stack.
```



## Expression Units
```
ExpressionUnit ::=
	| IDENTIFIER
	| PrimitiveLiteral
	| StringTemplate
	| "(" Expression ")"
;
```


### Static Semantics: Semantic Schema (Expression Units)
```
SemanticIdentifier[id: Unknown]
	::= ();
```


### Static Semantics: Decorate (Expression Units)
```
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
```
Unknown Assess(SemanticIdentifier iden) :=
	/* TO BE DETERMINED */
```


### Static Semantics: Build (Expression Units)
```
Sequence<Instruction> Build(SemanticIdentifier iden) :=
	/* TO BE DETERMINED */
```


### Runtime Instructions: Evaluate (Expression Units)
```
Void Evaluate(SemanticIdentifier iden) :=
	/* TO BE DETERMINED */
```



## Unary Operators
```
ExpressionUnarySymbol
	::= ExpressionUnit | ("+" | "-") ExpressionUnarySymbol;
```


### Static Semantics: Semantic Schema (Unary Operators)
```
SemanticOperation[operator: NEG]
	::= SemanticExpression[type=Integer | Float];
```


### Static Semantics: Decorate (Unary Operators)
```
Decorate(ExpressionUnarySymbol ::= ExpressionUnit) -> SemanticExpression
	:= Decorate(ExpressionUnit);
Decorate(ExpressionUnarySymbol ::= "+" ExpressionUnarySymbol) -> SemanticExpression
	:= Decorate(ExpressionUnarySymbol);
Decorate(ExpressionUnarySymbol ::= "-" ExpressionUnarySymbol) -> SemanticOperation
	:= (SemanticOperation[operator=NEG] Decorate(ExpressionUnarySymbol));
```


### Static Semantics: Assess (Unary Operators)
```
Or<Integer, Float>? Assess(SemanticOperation[operator=NEG] expr) :=
	1. *Assert:* `expr.children.count` is 1.
	2. *Let* `operand` be the result of performing `Assess(expr.children.0)`.
	3. *If* `TypeOf(operand)` is `Void`:
		1. *Return*.
	4. *Assert:* `IsNumeric(operand)` is `true`.
	5. *Let* `negation` be the additive inverse, `-operand`,
		obtained by negating `operand`.
	6. *Return:* `negation`.
```


### Static Semantics: Build (Unary Operators)
```
Sequence<Instruction> Build(SemanticOperation[operator=NEG] expr) :=
	1. *Assert:* `expr.children.count` is 1.
	2. *Let* `assess` be the result of performing `Assess(expr.children.0)`.
	3. *If* `TypeOf(assess)` is `Void`:
		1. *Let* `instrs` be the result of performing `Build(expr.children.0)`.
	4. *Else:*
		1. *Assert*: `TypeOf(assess)` is `Or<Null, Boolean, Integer, Float>`.
		2. *Let* `instrs` be the result of performing `Build(assess)`.
	5. *Return:* [...instrs, "Perform stack operation NEG."].
```


### Runtime Instructions: Evaluate (Unary Operators)
```
Void Evaluate(Instruction :::= "Perform stack operation NEG.") :=
	1. Pop `operand` from the operand stack.
	2. *Let* `negation` be the additive inverse, `-operand`,
		obtained by negating `operand`.
	3. Push `negation` onto the operand stack.
```



## Exponentiation
```
ExpressionExponential
	::= ExpressionUnarySymbol ("^" ExpressionExponential)?;
```


### Static Semantics: Semantic Schema (Exponentiation)
```
SemanticOperation[operator: EXP]
	::= SemanticExpression[type=Integer | Float] SemanticExpression[type=Integer | Float];
```


### Static Semantics: Decorate (Exponentiation)
```
Decorate(ExpressionExponential ::= ExpressionUnarySymbol) -> SemanticExpression
	:= Decorate(ExpressionUnarySymbol);
Decorate(ExpressionExponential ::= ExpressionUnarySymbol "^" ExpressionExponential) -> SemanticOperation
	:= (SemanticOperation[operator=EXP]
		Decorate(ExpressionUnarySymbol)
		Decorate(ExpressionExponential)
	);
```


### Static Semantics: Assess (Exponentiation)
```
Or<Integer, Float>? Assess(SemanticOperation[operator=EXP] expr) :=
	1. *Return:* `AssessSemanticOperationBinary(expr)`.
```


### Static Semantics: Build (Exponentiation)
```
Sequence<Instruction> Build(SemanticOperation[operator=EXP] expr) :=
	1. *Return:* `BuildSemanticOperationBinary(expr)`.
```


### Runtime Instructions: Evaluate (Exponentiation)
```
Void Evaluate(Instruction :::= "Perform stack operation EXP.") :=
	1. Pop `operand1` from the operand stack.
	2. Pop `operand0` from the operand stack.
	3. *Let* `power` be the result of performing `PerformNumericBinaryOperation(EXP, operand0, operand1)`.
	4. Push `power` onto the operand stack.
```



## Multiplicative
```
ExpressionMultiplicative
	::= (ExpressionMultiplicative ("*" | "/"))? ExpressionExponential;
```


### Static Semantics: Semantic Schema (Multiplicative)
```
SemanticOperation[operator: MUL | DIV]
	::= SemanticExpression[type=Integer | Float] SemanticExpression[type=Integer | Float];
```


### Static Semantics: Decorate (Multiplicative)
```
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
```
Or<Integer, Float>? Assess(SemanticOperation[operator=MUL|DIV] expr) :=
	1. *Return:* `AssessSemanticOperationBinary(expr)`.
```


### Static Semantics: Build (Multiplicative)
```
Sequence<Instruction> Build(SemanticOperation[operator=MUL|DIV] expr) :=
	1. *Return:* `BuildSemanticOperationBinary(expr)`.
```


### Runtime Instructions: Evaluate (Multiplicative)
```
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
```
ExpressionAdditive
	::= (ExpressionAdditive ("+" | "-"))? ExpressionMultiplicative;
```


### Static Semantics: Semantic Schema (Additive)
```
SemanticOperation[operator: ADD]
	::= SemanticExpression[type=Integer | Float] SemanticExpression[type=Integer | Float];
```


### Static Semantics: Decorate (Additive)
```
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
```
Or<Integer, Float>? Assess(SemanticOperation[operator=ADD] expr) :=
	1. *Return:* `AssessSemanticOperationBinary(expr)`.
```


### Static Semantics: Build (Additive)
```
Sequence<Instruction> Build(SemanticOperation[operator=ADD] expr) :=
	1. *Return:* `BuildSemanticOperationBinary(expr)`.
```


### Runtime Instructions: Evaluate (Additive)
```
Void Evaluate(Instruction :::= "Perform stack operation ADD.") :=
	1. Pop `operand1` from the operand stack.
	2. Pop `operand0` from the operand stack.
	3. *Let* `sum` be the result of performing `PerformNumericBinaryOperation(ADD, operand0, operand1)`.
	4. Push `sum` onto the operand stack.
```



## Conditional
```
ExpressionConditional
	::= "if" Expression "then" Expression "else" Expression;
```


### Static Semantics: Semantic Schema (Conditional)
```
SemanticOperation[operator: COND]
	::= SemanticExpression[type=Boolean] SemanticExpression SemanticExpression;
```


### Static Semantics: Decorate (Conditional)
```
Decorate(ExpressionConditional ::= "if" Expression__0 "then" Expression__1 "else" Expression__2)
	:= (SemanticOperation[operator=COND]
		Decorate(Expression__0),
		Decorate(Expression__1),
		Decorate(Expression__2),
	);
```


### Static Semantics: Assess (Conditional)
```
Or<Null, Boolean, Integer, Float>? Assess(SemanticOperation[operator=COND] expr) :=
	1. *Assert:* `expr.children.count` is 3.
	2. *Let* `condition` be the result of performing `Assess(expr.children.0)`.
	3. *If* `TypeOf(condition)` is `Void`:
		1. *Return*.
	4. *Assert:* `TypeOf(condition)` is `Boolean`.
	5. *If* `condition` is `true`:
		1. *Let* `consequent` be the result of performing `Assess(expr.children.1)`.
		2. *If* `TypeOf(consequent)` is `Void`:
			1. *Return*.
		3. *Return:* `consequent`.
	6. *Else:*
		1. *Let* `alternative` be the result of performing `Assess(expr.children.2)`.
		2. *If* `TypeOf(alternative)` is `Void`:
			1. *Return*.
		3. *Return:* `alternative`.
```


### Static Semantics: Build (Conditional)
```
Sequence<Instruction> Build(SemanticOperation[operator=COND] expr) :=
	1. *Assert:* `expr.children.count` is 3.
	2. *Let* `condition` be the result of performing `Assess(expr.children.0)`.
	3. *Assert:* `TypeOf(condition)` is `Void`.
	4. *Let* `instrs0` be the result of performing `Build(expr.children.0)`.
	5. *Let* `consequent` be the result of performing `Assess(expr.children.1)`.
	6. *If* `TypeOf(consequent)` is `Void`:
		1. *Let* `instrs1` be the result of performing `Build(expr.children.1)`.
	7. *Else*:
		1. *Let* `instrs1` be the result of performing `Build(consequent)`.
	8. *Let* `alternative` be the result of performing `Assess(expr.children.2)`.
	9. *If* `TypeOf(alternative)` is `Void`:
		1. *Let* `instrs2` be the result of performing `Build(expr.children.2)`.
	10. *Else*:
		1. *Let* `instrs2` be the result of performing `Build(alternative)`.
	11. *Return:* [
		...instrs0,
		"IF",
		...instrs1,
		"ELSE",
		...instrs2,
		"END",
	].
```


### Runtime Instructions: Evaluate (Conditional)
```
Void Evaluate(Instruction :::= "IF") :=
	1. Pop `condition` from the operand stack.
	2. *If* `condition` is non-zero:
		1. *Let* `consequent` be the result of performing the next instructions until an "ELSE" instruction is reached.
		2. Push `consequent` onto the operand stack.
	3. *Else:*
		1. *Let* `alternative` be the result of performing the instructions from the next "ELSE" and until an "END" instruction is reached.
		2. Push `alternative` onto the operand stack.
```
