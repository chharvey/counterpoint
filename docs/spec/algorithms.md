# Abstract Algorithms
This chapter lists and defines common abstract algorithms used throughout this specification.



## DigitCount
The **DigitCount** attribute grammar gives the [number](./types-values.md#real-integer-numbers) of
numeric (non-separator) digits in a digit sequence.
```
DigitCount(DigitSequenceDec :::= [0-9]) -> RealNumber
	:= 1;
DigitCount(DigitSequenceDec :::= DigitSequenceDec "_"? [0-9]) -> RealNumber
	:= DigitCount(DigitSequenceDec) + DigitCount([0-9]);
```



## CodePoint
The **CodePoint** of a character is the integer index of its placement in the Unicode character set.
A code point is *not* a code unit. A code point is simply Unicode’s index of a character,
whereas a code unit is the [UTF-8-encoded](#utf8encoding) value of that code point.
```
CodePoint([#x00-#x10ffff]) -> RealNumber
	:=; // TO BE DESCRIBED
```



## UTF8Encoding
Encodes a code point using the UTF-8 encoding algorithm.
In the UTF-8 encoding, characters in the Unicode character set
are represented by one to four code units
(but UTF-8 supports up to six code units for higher code points).
```
Sequence<RealNumber> Divide(RealNumber n, RealNumber count) :=
	1. *Assert:* `n` is greater than \x7f.
	2. *If* `count` is less than or equal to 1:
		1. *Return:* [`n`].
	3. *Assert:* `count` is greater than 1.
	4. *Let* `remainder` be the integer remainder of `n` / \x40.
	5. *Let* `quotient`  be the integer quotient  of `n` / \x40.
	6. *Else:*
		1. *Return:* [
			...*UnwrapAffirm:* `Divide(quotient, count - 1)`,
			`remainder`,
		].
;
Sequence<RealNumber> UTF8Encoding(RealNumber n) :=
	1. *If* `n` is less than 0:
		1. *Throw:* a new LexError.
	2. *If* `n` is less than or equal to \x7f:
		1. *Return:* [`n`].
	3. *If* `n` is less than or equal to \x7ff:
		1. *Let* `codeunits` be *UnwrapAffirm:* `Divide(n, 2)`.
		2. *Assert:* `codeunits.count` is 2.
		3. *Return:* [
			\xc0 + `codeunits.0`,
			\x80 + `codeunits.1`,
		].
	4. *If* `n` is less than or equal to \xffff:
		1. *Let* `codeunits` be *UnwrapAffirm:* `Divide(n, 3)`.
		2. *Assert:* `codeunits.count` is 3.
		3. *Return:* [
			\xe0 + `codeunits.0`,
			\x80 + `codeunits.1`,
			\x80 + `codeunits.2`,
		].
	5. *If* `n` is less than or equal to \x1f_ffff:
		1. *Let* `codeunits` be *UnwrapAffirm:* `Divide(n, 4)`.
		2. *Assert:* `codeunits.count` is 4.
		3. *Return:* [
			\xf0 + `codeunits.0`,
			\x80 + `codeunits.1`,
			\x80 + `codeunits.2`,
			\x80 + `codeunits.3`,
		].
	6. *If* `n` is less than or equal to \x3ff_ffff:
		1. *Let* `codeunits` be *UnwrapAffirm:* `Divide(n, 5)`.
		2. *Assert:* `codeunits.count` is 5.
		3. *Return:* [
			\xf8 + `codeunits.0`,
			\x80 + `codeunits.1`,
			\x80 + `codeunits.2`,
			\x80 + `codeunits.3`,
			\x80 + `codeunits.4`,
		].
	7. *If* `n` is less than or equal to \x7fff_ffff:
		1. *Let* `codeunits` be *UnwrapAffirm:* `Divide(n, 6)`.
		2. *Assert:* `codeunits.count` is 6.
		3. *Return:* [
			\xfc + `codeunits.0`,
			\x80 + `codeunits.1`,
			\x80 + `codeunits.2`,
			\x80 + `codeunits.3`,
			\x80 + `codeunits.4`,
			\x80 + `codeunits.5`,
		].
	8. *Throw:* a new LexError.
;
```



## UTF8Decoding
Decodes a sequence of code units into a sequence of code points using the UTF-8 decoding algorithm.
```
RealNumber Multiply(Sequence<RealNumber> ns) :=
	1. *If* `ns.count` is 0:
		1. *Return:* 0.
	2. *Return:* *UnwrapAffirm:* `Multiply(ns[0, -1])` * \x40 + `ns.lastItem`.
;
Nil! Continue(Sequence<RealNumber> units) :=
	1. *For index* `i` in `units`:
		1. *If* `i` is 0:
			1. *Skip.*
		2. *If* `units[i]` is less than \x80 or greater than or equal to \xc0:
			1. *Note:* The bits of `units[i]` are either "0_______" or "11______".
			2. *Throw:* `i`.
		3. *Note:* The bits of `units[i]` are "10______".
	2. *Return.*
;
RealNumber! UTF8Decoding(Sequence<RealNumber> codeunits) :=
	1. *Assert:* `codeunits.count` is 1, 2, 3, 4, 5, or 6:
	2. *If* `codeunits.0` is less than 0:
		1. *Return:* \xfffd. // U+FFFD REPLACEMENT CHARACTER
	3. *If* `codeunits.0` is less than \x80:
		1. *Note:* The bits of `codeunits.0` are "0_______".
		2. *Return:* `codeunits.0`.
	4. *If* `codeunits.0` is less than \xc0:
		1. *Note:* The bits of `codeunits.0` are "10______".
		2. *Return:* \xfffd.
	5. *If* `codeunits.0` is less than \xe0:
		1. *Note:* The bits of `codeunits.0` are "110_____".
		2. *Unwrap:* `Continue(codeunits[1, 2])`.
		3. *Return:* `Multiply([
			`codeunits.0` - \xc0,
			`codeunits.1` - \x80,
		])`.
	6. *If* `codeunits.0` is less than \xf0:
		1. *Note:* The bits of `codeunits.0` are "1110____".
		2. *Unwrap:* `Continue(codeunits[1, 3])`.
		3. *Return:* `Multiply([
			`codeunits.0` - \xe0,
			`codeunits.1` - \x80,
			`codeunits.2` - \x80,
		])`.
	7. *If* `codeunits.0` is less than \xf8:
		1. *Note:* The bits of `codeunits.0` are "11110___".
		2. *Unwrap:* `Continue(codeunits[1, 4])`.
		3. *Return:* `Multiply([
			`codeunits.0` - \xf0,
			`codeunits.1` - \x80,
			`codeunits.2` - \x80,
			`codeunits.3` - \x80,
		])`.
	8. *If* `codeunits.0` is less than \xfc:
		1. *Note:* The bits of `codeunits.0` are "111110__".
		2. *Unwrap:* `Continue(codeunits[1, 5])`.
		3. *Return:* `Multiply([
			`codeunits.0` - \xf8,
			`codeunits.1` - \x80,
			`codeunits.2` - \x80,
			`codeunits.3` - \x80,
			`codeunits.4` - \x80,
		])`.
	9. *If* `codeunits.0` is less than \xfe:
		1. *Note:* The bits of `codeunits.0` are "1111110_".
		2. *Unwrap:* `Continue(codeunits[1, 6])`.
		3. *Return:* `Multiply([
			`codeunits.0` - \xfc,
			`codeunits.1` - \x80,
			`codeunits.2` - \x80,
			`codeunits.3` - \x80,
			`codeunits.4` - \x80,
			`codeunits.5` - \x80,
		])`.
	10. *Return:* \xfffd.
;
```



## VarCheck
Performs the definite assignment piece during semantic analysis.



## TypeCheck
Performs the type-checking piece during semantic analysis.



## AssignTo
Attempt to assign a mutable collection literal to a mutable type when type-checking fails.
This assignment is attempted on an entry-by-entry basis.
```
Nil! AssignTo(SemanticExpressionCollection expr, Type type) :=
	1. *If* `expr` is a SemanticExpressionTuple *and* `type` is a Tuple type:
		1. *Note:* These steps are copied from the Subtype algorithm and modified slightly.
		2. *Let* `seq_b` be a Sequence whose items are exactly the items in `type`.
		3. *Let* `seq_b_req` be a filtering of `seq_b` for each `ib` such that `ib.optional` is `false`.
		4. *If* `expr.children.count` is less than `seq_b_req.count`:
			1. *Throw:* a new TypeErrorNotAssignable.
		5. *For index* `i` in `seq_b`:
			1. *If* `seq_b[i].optional` is `false`:
				1. *Assert:* `expr.children[i]` is set.
		6. *For index* `i` in `expr.children`:
			1. *Let* `ib` be `seq_b[i]`.
			2. *If:* `ib` is set:
				1. *Perform:* `TypeCheckAssign(expr.children[i], ib.type)`.
		7. *Return.*
	2. *If* `expr` is a SemanticExpressionRecord *and* `type` is a Record type:
		1. *Note:* These steps are copied from the Subtype algorithm and modified slightly.
		2. *Let* `struct_b` be a Schema whose properties are exactly the properties in `type`.
		3. *Let* `struct_b_req` be a filtering of `struct_b`’s values for each `vb` such that `vb.optional` is `false`.
		4. *If* `expr.children.count` is less than `struct_b_req.count`:
			1. *Throw:* a new TypeErrorNotAssignable.
		5. *For key* `k` in `struct_b`:
			1. *If* `struct_b[k].optional` is `false`:
				1. Find a SemanticProperty `property` in `expr.children` such that `property.children.0.id` is `k`.
				2. *If* `property` is not set:
					1. *Throw:* a new TypeErrorNotAssignable.
		6. *For each* `property` in `expr.children`:
			1. *Let* `vb` be `struct_b[property.children.0.id]`.
			2. *If:* `vb` is set:
				1. *Perform:* `TypeCheckAssign(property.children.1, vb.type)`.
		7. *Return.*
	3. *If* `expr` is a SemanticExpressionList *and* `type` is a List type:
		1. *Let* `b_type` be the type argument over `type`.
		2. *For each* `a_it` in `expr.children`:
			1. *Perform:* `TypeCheckAssign(a_it, b_type)`.
		3. *Return.*
	4. *If* `expr` is a SemanticExpressionDict *and* `type` is a Dict type:
		1. *Let* `b_type` be the type argument over `type`.
		2. *For each* `a_prop` in `expr.children`:
			1. *Perform:* `TypeCheckAssign(a_prop.children.1, b_type)`.
		3. *Return.*
	5. *If* `expr` is a SemanticExpressionSet *and* `type` is a Set type:
		1. *Let* `b_type` be the type argument over `type`.
		2. *For each* `a_el` in `expr.children`:
			1. *Perform:* `TypeCheckAssign(a_el, b_type)`.
		3. *Return.*
	6. *If* `expr` is a SemanticExpressionMap *and* `type` is a Map type:
		1. *Let* `b_ant_type` be the antecedent type argument over `type`.
		2. *Let* `b_con_type` be the consequent type argument over `type`.
		3. *For each* `a_case` in `expr.children`:
			1. *Perform:* `TypeCheckAssign(a_case.children.0, b_ant_type)`.
			2. *Perform:* `TypeCheckAssign(a_case.children.1, b_con_type)`.
		4. *Return.*
	7. *Throw:* a new TypeErrorNotAssignable.
;
```



## GetEntryInfo
```
EntryTypeSchema! GetEntryInfo(Type base_type, Or<SemanticTypeAccess, SemanticExpressionAccess> access, Boolean is_writing) :=
	1. *Assert:* `access.children.count` is 2.
	2. *Let* `accessor` be `access.children.1`.
	3. *Let* `accessor_maybe` be `false`.
	4. *If* `access.kind` is `MAYBE`:
		1. *Set* `accessor_maybe` to `true`.
	5. *If* *UnwrapAffirm:* `IsBottomType(base_type)` is `true`:
		1. *Return:* a new EntryTypeSchema [
				type=     `Nothing`,
				optional= `accessor_maybe`,
			].
	6. *If* `base_type` is a Maybe type *and* `access.kind` is MAYBE:
		1. *Let* `entry_info` be *Unwrap*: `GetEntryInfo(base_type.typearg, access, is_writing)`.
		2. *Return:* a new EntryTypeSchema [
			type=     `Maybe(entry_info.type)`,
			optional= `entry_info.optional`,
		].
	7. *Else:*
		1. Fall through.
	8. *If* `base_type` is the intersection or union of some types `a` and `b`:
		1. If `a` and `b` are of different types:
			1. *Throw:* a new TypeErrorInvalidOperation.
		2. *Let* `entry_infos` be the Sequence [`GetEntryInfo(a, access, is_writing)`, `GetEntryInfo(b, access, is_writing)`].
		3. *Let* `errors` be a filtering of `entry_infos` for each `info` such that `info` is an abrupt completion.
		4. *Let* `entries` be a filtering of `entry_infos` for each `info` such that `info` is a normal completion.
		5. *Set* `errors` to a mapping of `errors` for each `err` to `err.value`.
		6. *Set* `entries` to a mapping of `entries` for each `entry` to `entry.value`.
		7. *If* `base_type` is the intersection of some types `a` and `b`:
			1. *If* `entries.count` is 0:
				1. *Throw:* all of the items in `errors`.
			2. *Let* `all_optional` be `true`.
			3. *For each* `entry` in `entries`:
				1. *If* `entry.optional` is `false`:
					1. *Set* `all_optional` to `false`.
			4. *Let* `intersection` be a reduction of `entries` for each `x` and `y` to *UnwrapAffirm:* `Intersection(x.type, y.type)`.
			5. *Return:* a new EntryTypeSchema [
					type=     `intersection`,
					optional= `all_optional`,
				].
		8. *Else:*
			1. *Assert:* `base_type` is the union of some types `a` and `b`.
			2. *If* `errors.count` is greater than 0:
				1. *Throw:* all of the items in `errors`.
			3. *Let* `any_optional` be `false`.
			4. *For each* `entry` in `entries`:
				1. *If* `entry.optional` is `true`:
					1. *Set* `any_optional` to `true`.
			5. *Let* `union` be a reduction of `entries` for each `x` and `y` to *UnwrapAffirm:* `Union(x.type, y.type)`.
			6. *Return:* a new EntryTypeSchema [
					type=     `union`,
					optional= `any_optional`,
				].
	9. *If* `accessor` is a SemanticIndex:
		1. *If* `base_type` is a Tuple type *and* `accessor.index` is an index in `base_type`:
			1. *Return:* the item accessed at index `accessor.index` in `base_type`.
		2. *Else:*
			1. *Throw:* a new TypeErrorNoEntry.
	10. *Else If* `accessor` is a SemanticKey:
		1. *If* `base_type` is a Record type *and* `accessor.id` is a key in `base_type`:
			1. *Return:* the value accessed at key `accessor.id` in `base_type`.
		2. *Else:*
			1. *Throw:* a new TypeErrorNoEntry.
	11. *Else:*
		1. *Assert:* `accessor` is a SemanticExpression.
		2. *Let* `accessor_type` be *Unwrap:* `TypeOf(accessor)`.
		3. *If* *UnwrapAffirm:* `IsBottomType(accessor_type)` is `true`:
			1. *Return:* a new EntryTypeSchema [
					type=     `Nothing`,
					optional= `accessor_maybe`,
				].
		4. *If* `base_type` is a List type:
			1. *Let* `t` be the type argument over `base_type`.
			2. *Let* `integral` be *UnwrapAffirm:* `Union(Integer, Natural)`.
			3. *If* *UnwrapAffirm:* `Subtype(accessor_type, integral)` is `true`:
				1. *Return:* a new EntryTypeSchema [
					type=     `t`,
					optional= `accessor_maybe`,
				].
			4. *Else:*
				1. *Throw:* a new TypeErrorNotNarrow.
		5. *Else If* `base_type` is a Dict type:
			1. *Let* `t` be the type argument over `base_type`.
			2. *If* *UnwrapAffirm:* `Subtype(accessor_type, Symbol)` is `true`:
				1. *Return:* a new EntryTypeSchema [
					type=     `t`,
					optional= `accessor_maybe`,
				].
			3. *If* *UnwrapAffirm:* `Subtype(accessor_type, String)` is `true`:
				1. *Note:* This step will be removed once string keys are supported.
				2. *Throw:* a new Error "String keys for dict access are not yet supported."
			4. *Else:*
				1. *Throw:* a new TypeErrorNotNarrow.
		6. *Else If* `base_type` is a Set type:
			1. *Let* `t` be the type argument over `base_type`.
			2. *If* *UnwrapAffirm:* `Subtype(accessor_type, t)` is `true` *or* `is_writing` is `false`:
				1. *Return:* a new EntryTypeSchema [
					type=     `Boolean`,
					optional= `false`,
				].
			3. *Else:*
				1. *Throw:* a new TypeErrorNotNarrow.
		7. *Else If* `base_type` is a Map type:
			1. *Let* `k` be the antecedent type argument over `base_type`.
			2. *Let* `v` be the consequent type argument over `base_type`.
			3. *If* *UnwrapAffirm:* `Subtype(accessor_type, k)` is `true` *or* `is_writing` is `false`:
				1. *Return:* a new EntryTypeSchema [
					type=     `v`,
					optional= `accessor_maybe`,
				].
			4. *Else:*
				1. *Throw:* a new TypeErrorNotNarrow.
		8. *Else:*
			1. *Throw:* a new TypeErrorInvalidOperation.
;
```



## AccessType
Checks for correctness, matching access kind with accessed bound entry of a collection,
then returns either the resulting type unwrapped or wrapped a Maybe.
If access kind is normal, the entry must be non-optioal.
If access kind is maybe, the entry must be optional, or base must be a Maybe.
Otherwise, the access kind may be result.
```
Type! AccessType(Or<NORMAL, MAYBE, RESULT> access_kind, Type base_type, EntryTypeSchema entry) :=
	1. *If* `access_kind` is *NORMAL* *and* `entry.optional` is `true`:
		1. *Throw:* a new TypeErrorInvalidOperation.
	2. *Else If* `access_kind` is *MAYBE*:
		1. *If* `entry.optional` is `false` *and* `base_type` is not a Maybe type:
			1. *Throw:* a new TypeErrorInvalidOperation.
		2. *Else:*
			1. Fall through.
	3. *Else:*
		1. *Assert:* `access_kind` is *RESULT*.
		// TODO: implement
	4. *If* `entry.optional` is `true`:
		1. *Return:* `Maybe(entry.type)`.
	5. *Else:*
		1. *Return:* `entry.type`.
;
```



## WriteTypeOf
Assuming reassignment of a symbol/entry is valid, gives the write-type of that symbol/entry.
```
Type! WriteTypeOf(Or<SemanticExpressionVariable, SemanticExpressionAccess> reassignable) :=
	1. *If* `reassignable` is a SemanticExpressionVariable:
		1. *Assert:* The validator’s symbol table contains a SymbolSchema `symbol` whose `id` is `reassignable.id`.
		2. *Assert:* `symbol` is an instance of `SymbolSchemaVar`.
		3. *Return:* `symbol.type`.
	2. *Else:*
		1. *Assert:* `reassignable` is a SemanticExpressionAccess.
		2. *Assert:* `reassignable.children.count` is 2.
		3. *Let* `base` be `reassignable.children.0`.
		4. *Let* `base_type` be *Unwrap:* `TypeOf(base)`.
		5. *Let* `entry` be *Unwrap:* `GetEntryInfo(base_type, reassignable, true)`.
		6. *Return:* `entry.type`.
;
```
