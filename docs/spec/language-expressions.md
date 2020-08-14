# Solid Language: Expressions
This chapter defines the syntax, semantics, and behavior of expressions in the Solid programming language.


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
	8. *Return:* `Float(PerformNumericBinaryOperation(expr.operator, Float(float0), Float(float1)))`.
```


### Abstract Operation: TryAssessAndBuild
The abstract operation **TryAssessAndBuild** attempts to assess a semantic node first and then build the assessment;
if the assessment fails, it builds the semantic node.
```
Sequence<Instruction> TryAssessAndBuild(SemanticExpression expr) :=
	1. *Let* `assess` be the result of performing `Assess(expr)`.
	2. *If* `TypeOf(assess)` is `Void`:
		1. *Let* `instrs` be the result of performing `Build(expr)`.
	3. *Else:*
		1. *Let* `instrs` be the result of performing `Build(assess)`.
	4. *Return:* `instrs`.
```


### Abstract Operation: PrebuildSemanticOperationBinary
```
Sequence<Sequence<Instruction>, Sequence<Instruction>> PrebuildSemanticOperationBinary(SemanticOperation expr) :=
	1. *Assert:* `expr.children.count` is 2.
	2. *Let* `instrs0` be the result of performing `TryAssessAndBuild(expr.children.0)`.
	3. *Let* `instrs1` be the result of performing `TryAssessAndBuild(expr.children.1)`.
	4. *Return:* [instrs0, instrs1].
```



## Literals


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


### Static Semantics: Build (Unary Operators)
```
Sequence<Instruction> Build(SemanticOperation[operator: NOT | EMPTY | NEG] expr) :=
	1. *Assert:* `expr.children.count` is 1.
	2. *Let* `instrs` be the result of performing `TryAssessAndBuild(expr.children.0)`.
	3. *Return:* [
		...instrs,
		"`expr.operator`",
	].
```


### Runtime Instructions: Evaluate (Unary Operators)
```
Void Evaluate(Instruction :::= "NOT") :=
	1. Pop `operand` from the operand stack.
	2. *If* `TypeOf(operand)` is `Integer` *and* `operand` is `0`:
		1. Push `1` onto the operand stack.
	3. Push `0` onto the operand stack.
Void Evaluate(Instruction :::= "EMPTY") :=
	1. Pop `operand` from the operand stack.
	2. *If* `TypeOf(operand)` is `Integer` *and* `operand` is `0`:
		1. Push `1` onto the operand stack.
	3. *If* `TypeOf(operand)` is `Float` *and* `operand` is `0.0` or `-0.0`:
		1. Push `1` onto the operand stack.
	4. Push `0` onto the operand stack.
Void Evaluate(Instruction :::= "NEG") :=
	1. Pop `operand` from the operand stack.
	2. *Let* `negation` be the additive inverse, `-operand`,
		obtained by negating `operand`.
	3. Push `negation` onto the operand stack.
```



## Exponentiation


### Static Semantics: Build (Exponentiation)
```
Sequence<Instruction> Build(SemanticOperation[operator: EXP] expr) :=
	1. *Let* `builds` be `PrebuildSemanticOperationBinary(expr)`.
	2. *Return:* [
		...builds.0,
		...builds.1,
		"EXP",
	].
```


### Runtime Instructions: Evaluate (Exponentiation)
```
Void Evaluate(Instruction :::= "EXP") :=
	1. Pop `operand1` from the operand stack.
	2. Pop `operand0` from the operand stack.
	3. *Let* `power` be the result of performing `PerformNumericBinaryOperation(EXP, operand0, operand1)`.
	4. Push `power` onto the operand stack.
```



## Multiplicative


### Static Semantics: Build (Multiplicative)
```
Sequence<Instruction> Build(SemanticOperation[operator: MUL | DIV] expr) :=
	1. *Let* `builds` be `PrebuildSemanticOperationBinary(expr)`.
	2. *Return:* [
		...builds.0,
		...builds.1,
		"`expr.operator`",
	].
```


### Runtime Instructions: Evaluate (Multiplicative)
```
Void Evaluate(Instruction :::= "MUL") :=
	1. Pop `operand1` from the operand stack.
	2. Pop `operand0` from the operand stack.
	3. *Let* `product` be the result of performing `PerformNumericBinaryOperation(MUL, operand0, operand1)`.
	4. Push `product` onto the operand stack.
Void Evaluate(Instruction :::= "DIV") :=
	1. Pop `operand1` from the operand stack.
	2. Pop `operand0` from the operand stack.
	3. *Let* `quotient` be the result of performing `PerformNumericBinaryOperation(DIV, operand0, operand1)`.
	4. Push `quotient` onto the operand stack.
```



## Additive


### Static Semantics: Build (Additive)
```
Sequence<Instruction> Build(SemanticOperation[operator: ADD] expr) :=
	1. *Let* `builds` be `PrebuildSemanticOperationBinary(expr)`.
	2. *Return:* [
		...builds.0,
		...builds.1,
		"ADD",
	].
```


### Runtime Instructions: Evaluate (Additive)
```
Void Evaluate(Instruction :::= "ADD") :=
	1. Pop `operand1` from the operand stack.
	2. Pop `operand0` from the operand stack.
	3. *Let* `sum` be the result of performing `PerformNumericBinaryOperation(ADD, operand0, operand1)`.
	4. Push `sum` onto the operand stack.
```



## Conjunctive


### Static Semantics: Build (Conjunctive)
```
Sequence<Instruction> Build(SemanticOperation[operator: AND] expr) :=
	1. *Let* `builds` be `PrebuildSemanticOperationBinary(expr)`.
	2. *Return:* [
		...builds.0,
		"TEE the local variable `operand0`.",
		"NOT",
		"NOT",
		"IF",
		...builds.1,
		"ELSE",
		"GET the local variable `operand0`.",
		"END",
	].
```



## Disjunctive


### Static Semantics: Build (Disjunctive)
```
Sequence<Instruction> Build(SemanticOperation[operator: OR] expr) :=
	1. *Let* `builds` be `PrebuildSemanticOperationBinary(expr)`.
	2. *Return:* [
		...builds.0,
		"TEE the local variable `operand0`.",
		"NOT",
		"NOT",
		"IF",
		"GET the local variable `operand0`.",
		"ELSE",
		...builds.1,
		"END",
	].
```



## Conditional


### Static Semantics: Build (Conditional)
```
Sequence<Instruction> Build(SemanticOperation[operator: COND] expr) :=
	1. *Assert:* `expr.children.count` is 3.
	2. *Let* `instrs0` be the result of performing `TryAssessAndBuild(expr.children.0)`.
	3. *Let* `instrs1` be the result of performing `TryAssessAndBuild(expr.children.1)`.
	4. *Let* `instrs2` be the result of performing `TryAssessAndBuild(expr.children.2)`.
	5. *Return:* [
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
