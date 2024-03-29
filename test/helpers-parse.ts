import * as assert from 'assert'
import type {
	NonemptyArray,
} from '../src/lib/index.js';
import {
	SolidConfig,
	CONFIG_DEFAULT,
} from '../src/core/index.js';
import {
	Filebound,
	TemplatePosition,
	Punctuator,
	Token,
	TokenFilebound,
	TOKEN_SOLID as TOKEN,
	ParseNode,
	PARSENODE_SOLID as PARSENODE,
	ParserSolid,
	PARSER_SOLID as PARSER,
} from '../src/parser/index.js';
import {
	assert_arrayLength,
} from './assert-helpers.js';



export function wordFromString(wordstring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeWord {
	const property: PARSENODE.ParseNodeProperty = propertyFromString(`${ wordstring } = null`, config);
	return property.children[0];
}
export function tokenLiteralFromTypeString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString {
	const token: Token = primitiveTypeFromString(typestring, config).children[0]
	assert.ok(
		token instanceof TOKEN.TokenKeyword ||
		token instanceof TOKEN.TokenNumber  ||
		token instanceof TOKEN.TokenString
	, 'token should be a TokenKeyword or TokenNumber or TokenString')
	return token
}
export function tokenKeywordFromTypeString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): TOKEN.TokenKeyword {
	const token: Token = keywordTypeFromString(typestring, config).children[0]
	assert.ok(token instanceof TOKEN.TokenKeyword, 'token should be a TokenKeyword')
	return token
}
export function tokenIdentifierFromTypeString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): TOKEN.TokenIdentifier {
	const unit: PARSENODE.ParseNodeTypeUnit['children'][0] = typeLiteralFromString(typestring, config);
	assert.ok(unit instanceof TOKEN.TokenIdentifier, 'unit should be a TokenIdentifier');
	return unit;
}
export function primitiveTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodePrimitiveLiteral {
	const unit: PARSENODE.ParseNodeTypeUnit['children'][0] = typeLiteralFromString(typestring, config);
	assert.ok(unit instanceof PARSENODE.ParseNodePrimitiveLiteral, 'unit should be a ParseNodePrimitiveLiteral')
	return unit
}
export function keywordTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeTypeKeyword {
	const unit: PARSENODE.ParseNodeTypeUnit['children'][0] = typeLiteralFromString(typestring, config);
	assert.ok(unit instanceof PARSENODE.ParseNodeTypeKeyword, 'unit should be a ParseNodeTypeKeyword')
	return unit
}
export function entryTypeFromString(itemstring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeEntryType | PARSENODE.ParseNodeEntryType_Optional {
	const tupletype: PARSENODE.ParseNodeTypeTupleLiteral = tupleTypeFromString(`[${ itemstring }]`, config);
	assert_arrayLength(tupletype.children, 3, 'tuple type should have 3 children');
	assert_arrayLength(tupletype.children[1].children, 1, 'items production should have 1 child');
	assert_arrayLength(tupletype.children[1].children[0].children, 1, 'item list should have 1 child');
	return tupletype.children[1].children[0].children[0];
}
export function entryTypeNamedFromString(propertystring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeEntryType_Named | PARSENODE.ParseNodeEntryType_Named_Optional {
	const recordtype: PARSENODE.ParseNodeTypeRecordLiteral = recordTypeFromString(`[${ propertystring }]`, config);
	assert_arrayLength(recordtype.children, 3, 'record type should have 3 children');
	assert_arrayLength(recordtype.children[1].children, 1, 'properties production should have 1 child');
	assert_arrayLength(recordtype.children[1].children[0].children, 1, 'property list should have 1 child');
	return recordtype.children[1].children[0].children[0];
}
export function tupleTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeTypeTupleLiteral {
	const unit: PARSENODE.ParseNodeTypeUnit['children'][0] = typeLiteralFromString(typestring, config);
	assert.ok(unit instanceof PARSENODE.ParseNodeTypeTupleLiteral, 'unit should be a ParseNodeTypeTupleLiteral');
	return unit;
}
export function recordTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeTypeRecordLiteral {
	const unit: PARSENODE.ParseNodeTypeUnit['children'][0] = typeLiteralFromString(typestring, config);
	assert.ok(unit instanceof PARSENODE.ParseNodeTypeRecordLiteral, 'unit should be a ParseNodeTypeRecordLiteral');
	return unit;
}
export function dictTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeTypeDictLiteral {
	const unit: PARSENODE.ParseNodeTypeUnit['children'][0] = typeLiteralFromString(typestring, config);
	assert.ok(unit instanceof PARSENODE.ParseNodeTypeDictLiteral, 'unit should be a ParseNodeTypeDictLiteral');
	return unit;
}
export function mapTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeTypeMapLiteral {
	const unit: PARSENODE.ParseNodeTypeUnit['children'][0] = typeLiteralFromString(typestring, config);
	assert.ok(unit instanceof PARSENODE.ParseNodeTypeMapLiteral, 'unit should be a ParseNodeTypeMapLiteral');
	return unit;
}
function typeLiteralFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeTypeUnit['children'][0] {
	const type_unit: PARSENODE.ParseNodeTypeUnit = unitTypeFromString(typestring, config);
	assert_arrayLength(type_unit.children, 1, 'type unit should have 1 child');
	const unit: PARSENODE.ParseNodeTypeUnit['children'][0] = type_unit.children[0];
	return unit
}
export function unitTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeTypeUnit {
	const type_compound: PARSENODE.ParseNodeTypeCompound = compoundTypeFromString(typestring, config);
	assert_arrayLength(type_compound.children, 1, 'compound type should have 1 child');
	return type_compound.children[0];
}
export function compoundTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeTypeCompound {
	const type_unary_symbol: PARSENODE.ParseNodeTypeUnarySymbol = unarySymbolTypeFromString(typestring, config);
	assert_arrayLength(type_unary_symbol.children, 1, 'unary-symbol type should have 1 child');
	return type_unary_symbol.children[0];
}
export function unarySymbolTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeTypeUnarySymbol {
	const type_unary_keyword: PARSENODE.ParseNodeTypeUnaryKeyword = unaryKeywordTypeFromString(typestring, config);
	assert_arrayLength(type_unary_keyword.children, 1, 'unary-keyword type should have 1 child');
	return type_unary_keyword.children[0];
}
export function unaryKeywordTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeTypeUnaryKeyword {
	const type_intersection: PARSENODE.ParseNodeTypeIntersection = intersectionTypeFromString(typestring, config)
	assert_arrayLength(type_intersection.children, 1, 'intersection type should have 1 child')
	return type_intersection.children[0]
}
export function intersectionTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeTypeIntersection {
	const type_union: PARSENODE.ParseNodeTypeUnion = unionTypeFromString(typestring, config)
	assert_arrayLength(type_union.children, 1, 'union type should have 1 child')
	return type_union.children[0]
}
export function unionTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeTypeUnion {
	return typeFromString(typestring, config).children[0]
}
function typeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeType {
	return typeDeclarationFromSource(`type T = ${ typestring };`, config).children[3];
}
export function propertyFromString(propertystring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeProperty {
	const record: PARSENODE.ParseNodeRecordLiteral = recordLiteralFromSource(`[${ propertystring }];`, config);
	assert_arrayLength(record.children, 3, 'record should have 3 children');
	assert_arrayLength(record.children[1].children, 1, 'property list should have 1 child');
	return record.children[1].children[0];
}
export function caseFromString(casestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeCase {
	const map: PARSENODE.ParseNodeMapLiteral = mapLiteralFromSource(`{${ casestring }};`, config);
	assert_arrayLength(map.children, 3, 'map should have 3 children');
	assert_arrayLength(map.children[1].children, 1, 'case list should have 1 child');
	return map.children[1].children[0];
}
export function tokenLiteralFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString {
	const token: Token = primitiveLiteralFromSource(src, config).children[0]
	assert.ok(
		token instanceof TOKEN.TokenKeyword ||
		token instanceof TOKEN.TokenNumber  ||
		token instanceof TOKEN.TokenString
	, 'token should be a TokenKeyword or TokenNumber or TokenString')
	return token
}
export function tokenTemplateFullFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): TOKEN.TokenTemplate {
	const string_template: PARSENODE.ParseNodeStringTemplate = stringTemplateFromSource(src, config);
	assert_arrayLength(string_template.children, 1, 'string template should have 1 child');
	const token: Token = string_template.children[0];
	assert.ok(token instanceof TOKEN.TokenTemplate);
	assert.strictEqual(token.position, TemplatePosition.FULL);
	return token;
}
export function tokenIdentifierFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): TOKEN.TokenIdentifier {
	const expression_unit: PARSENODE.ParseNodeExpressionUnit = unitExpressionFromSource(src, config)
	assert_arrayLength(expression_unit.children, 1, 'expression unit should have 1 child')
	const unit: PARSENODE.ParseNodeExpressionUnit['children'][0] = expression_unit.children[0];
	assert.ok(unit instanceof TOKEN.TokenIdentifier, 'unit should be a TokenIdentifier')
	return unit
}
export function primitiveLiteralFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodePrimitiveLiteral {
	const unit: PARSENODE.ParseNodeExpressionUnit['children'][0] = valueLiteralFromSource(src, config);
	assert.ok(unit instanceof PARSENODE.ParseNodePrimitiveLiteral, 'unit should be a ParseNodePrimitiveLiteral')
	return unit
}
export function stringTemplateFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeStringTemplate {
	const unit: PARSENODE.ParseNodeExpressionUnit['children'][0] = valueLiteralFromSource(src, config);
	assert.ok(unit instanceof PARSENODE.ParseNodeStringTemplate, 'unit should be a ParseNodeStringTemplate');
	return unit;
}
export function tupleLiteralFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeTupleLiteral {
	const unit: PARSENODE.ParseNodeExpressionUnit['children'][0] = valueLiteralFromSource(src, config);
	assert.ok(unit instanceof PARSENODE.ParseNodeTupleLiteral, 'unit should be a ParseNodeTupleLiteral');
	return unit;
}
export function recordLiteralFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeRecordLiteral {
	const unit: PARSENODE.ParseNodeExpressionUnit['children'][0] = valueLiteralFromSource(src, config);
	assert.ok(unit instanceof PARSENODE.ParseNodeRecordLiteral, 'unit should be a ParseNodeRecordLiteral');
	return unit;
}
export function setLiteralFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeSetLiteral {
	const unit: PARSENODE.ParseNodeExpressionUnit['children'][0] = valueLiteralFromSource(src, config);
	assert.ok(unit instanceof PARSENODE.ParseNodeSetLiteral, 'unit should be a ParseNodeSetLiteral');
	return unit;
}
export function mapLiteralFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeMapLiteral {
	const unit: PARSENODE.ParseNodeExpressionUnit['children'][0] = valueLiteralFromSource(src, config);
	assert.ok(unit instanceof PARSENODE.ParseNodeMapLiteral, 'unit should be a ParseNodeMapLiteral');
	return unit;
}
function valueLiteralFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeExpressionUnit['children'][0] {
	const expression_unit: PARSENODE.ParseNodeExpressionUnit = unitExpressionFromSource(src, config);
	assert_arrayLength(expression_unit.children, 1, 'expression unit should have 1 child');
	const unit: PARSENODE.ParseNodeExpressionUnit['children'][0] = expression_unit.children[0];
	return unit;
}
export function unitExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeExpressionUnit {
	const expression_compound: PARSENODE.ParseNodeExpressionCompound = compoundExpressionFromSource(src, config)
	assert_arrayLength(expression_compound.children, 1, 'compound expression should have 1 child');
	return expression_compound.children[0];
}
export function compoundExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeExpressionCompound {
	const expression_unary: PARSENODE.ParseNodeExpressionUnarySymbol = unaryExpressionFromSource(src, config);
	assert_arrayLength(expression_unary.children, 1, 'unary expression should have 1 child');
	return expression_unary.children[0];
}
export function unaryExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeExpressionUnarySymbol {
	const expression_exp: PARSENODE.ParseNodeExpressionExponential = exponentialExpressionFromSource(src, config)
	assert_arrayLength(expression_exp.children, 1, 'exponential expression should have 1 child')
	return expression_exp.children[0]
}
export function exponentialExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeExpressionExponential {
	const expression_mul: PARSENODE.ParseNodeExpressionMultiplicative = multiplicativeExpressionFromSource(src, config)
	assert_arrayLength(expression_mul.children, 1, 'multiplicative expression should have 1 child')
	return expression_mul.children[0]
}
export function multiplicativeExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeExpressionMultiplicative {
	const expression_add: PARSENODE.ParseNodeExpressionAdditive = additiveExpressionFromSource(src, config)
	assert_arrayLength(expression_add.children, 1, 'additive expression should have 1 child')
	return expression_add.children[0]
}
export function additiveExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeExpressionAdditive {
	const expression_compare: PARSENODE.ParseNodeExpressionComparative = comparativeExpressionFromSource(src, config)
	assert_arrayLength(expression_compare.children, 1, 'comparative expression should have 1 child')
	return expression_compare.children[0]
}
export function comparativeExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeExpressionComparative {
	const expression_eq: PARSENODE.ParseNodeExpressionEquality = equalityExpressionFromSource(src, config)
	assert_arrayLength(expression_eq.children, 1, 'equality expression should have 1 child')
	return expression_eq.children[0]
}
export function equalityExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeExpressionEquality {
	const expression_conj: PARSENODE.ParseNodeExpressionConjunctive = conjunctiveExpressionFromSource(src, config)
	assert_arrayLength(expression_conj.children, 1, 'conjunctive expression should have 1 child')
	return expression_conj.children[0]
}
export function conjunctiveExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeExpressionConjunctive {
	const expression_disj: PARSENODE.ParseNodeExpressionDisjunctive = disjunctiveExpressionFromSource(src, config)
	assert_arrayLength(expression_disj.children, 1, 'disjunctive expression should have 1 child')
	return expression_disj.children[0]
}
export function disjunctiveExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeExpressionDisjunctive {
	const expression: PARSENODE.ParseNodeExpression = expressionFromSource(src, config)
	const expression_disj: PARSENODE.ParseNodeExpressionDisjunctive | PARSENODE.ParseNodeExpressionConditional = expression.children[0]
	assert.ok(expression_disj instanceof PARSENODE.ParseNodeExpressionDisjunctive, 'expression_disj should be a ParseNodeExpressionDisjunctive')
	return expression_disj
}
export function conditionalExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeExpressionConditional {
	const expression: PARSENODE.ParseNodeExpression = expressionFromSource(src, config)
	const expression_cond: PARSENODE.ParseNodeExpressionDisjunctive | PARSENODE.ParseNodeExpressionConditional = expression.children[0]
	assert.ok(expression_cond instanceof PARSENODE.ParseNodeExpressionConditional, 'expression_cond should be a ParseNodeExpressionConditional')
	return expression_cond
}
export function expressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeExpression {
	const statement: PARSENODE.ParseNodeStatement = statementFromSource(src, config)
	assert_arrayLength(statement.children, 2, 'statment should have 2 children')
	const [expression, endstat]: readonly [PARSENODE.ParseNodeExpression, Token] = statement.children
	assert.ok(endstat instanceof TOKEN.TokenPunctuator)
	assert.strictEqual(endstat.source, Punctuator.ENDSTAT)
	return expression
}
export function typeDeclarationFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeDeclarationType {
	const declaration: PARSENODE.ParseNodeDeclaration = declarationFromSource(src, config);
	assert_arrayLength(declaration.children, 1, 'declaration should have 1 child');
	const typ_decl: PARSENODE.ParseNodeDeclarationVariable | PARSENODE.ParseNodeDeclarationType = declaration.children[0];
	assert.ok(typ_decl instanceof PARSENODE.ParseNodeDeclarationType);
	return typ_decl;
}
export function variableDeclarationFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeDeclarationVariable {
	const declaration: PARSENODE.ParseNodeDeclaration = declarationFromSource(src, config);
	assert_arrayLength(declaration.children, 1, 'declaration should have 1 child');
	const var_decl: PARSENODE.ParseNodeDeclarationVariable | PARSENODE.ParseNodeDeclarationType = declaration.children[0];
	assert.ok(var_decl instanceof PARSENODE.ParseNodeDeclarationVariable)
	return var_decl
}
function declarationFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeDeclaration {
	const statement: PARSENODE.ParseNodeStatement = statementFromSource(src, config);
	assert_arrayLength(statement.children, 1, 'statement should have 1 child');
	const declaration: Token | PARSENODE.ParseNodeDeclaration | PARSENODE.ParseNodeStatementAssignment = statement.children[0];
	assert.ok(declaration instanceof PARSENODE.ParseNodeDeclaration);
	return declaration;
}
export function assigneeFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeAssignee {
	const assignment: PARSENODE.ParseNodeStatementAssignment = assignmentFromSource(src, config);
	const assignee: PARSENODE.ParseNodeAssignee = assignment.children[0];
	return assignee;
}
export function assignmentFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeStatementAssignment {
	const statement: PARSENODE.ParseNodeStatement = statementFromSource(src, config);
	assert_arrayLength(statement.children, 1, 'statement should have 1 child');
	const assignment: Token | PARSENODE.ParseNodeDeclaration | PARSENODE.ParseNodeStatementAssignment = statement.children[0];
	assert.ok(assignment instanceof PARSENODE.ParseNodeStatementAssignment);
	return assignment;
}
export function statementFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeStatement {
	const goal: PARSENODE.ParseNodeGoal = goalFromSource(src, config);
	assert_arrayLength(goal.children, 3, 'goal should have 3 children')
	const [sot, stat_list, eot]: readonly [Token, PARSENODE.ParseNodeGoal__0__List, Token] = goal.children
	assert.ok(sot instanceof TokenFilebound)
	assert.ok(eot instanceof TokenFilebound)
	assert.strictEqual(sot.source, Filebound.SOT)
	assert.strictEqual(eot.source, Filebound.EOT)
	assert_arrayLength(stat_list.children, 1, 'statement list should have 1 child')
	return stat_list.children[0]
}
export function goalFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSENODE.ParseNodeGoal {
	return ((config === CONFIG_DEFAULT) ? PARSER : new ParserSolid(config)).parse(src);
}



/**
 * Tests a production of the form `List ::= (List ",")? Item`,
 * matching given source strings to each `Item`.
 * For example, given the following parse node
 * ```xml
 * <List>
 * 	<List>
 * 		<List>
 * 			<Item source="a">...</Item>
 * 		</List>
 * 		<PUNCTUATOR>,</PUNCTUATOR>
 * 		<Item source="b">...</Item>
 * 	</List>
 * 	<PUNCTUATOR>,</PUNCTUATOR>
 * 	<Item source="c">...</Item>
 * </List>
 * ```
 * the following test would pass:
 * @example
 * hashListSources(parsenode, 'a', 'b', 'c');
 * @param pnode the parse node to test
 * @param srcs  the source code strings
 */
export function hashListSources(pnode: ParseNode, ...srcs: Readonly<NonemptyArray<string>>): void {
	if (srcs.length === 1) {
		assert_arrayLength(pnode.children, 1);
		assert.strictEqual((pnode.children[0] as Token | ParseNode).source, srcs[0]);
	} else {
		assert_arrayLength(pnode.children, 3);
		assert.strictEqual((pnode.children[1] as Token | ParseNode).source, Punctuator.COMMA);
		assert.strictEqual((pnode.children[2] as Token | ParseNode).source, srcs[srcs.length - 1]); // COMBAK srcs.lastItem
		return hashListSources(pnode.children[0] as ParseNode, ...srcs.slice(0, -1) as NonemptyArray<string>);
	};
}



export function templateSources(tpl: PARSENODE.ParseNodeStringTemplate, ...srcs: Readonly<NonemptyArray<string>>): void {
	assert.strictEqual(tpl.children[0].source, srcs[0]);
	if (srcs.length === 1) {
		/* StringTemplate ::= TEMPLATE_FULL; */
		assert_arrayLength(tpl.children, 1);
	} else if (srcs.length === 2) {
		/* StringTemplate ::= TEMPLATE_HEAD TEMPLATE_TAIL; */
		assert_arrayLength(tpl.children, 2);
		assert.strictEqual(tpl.children[1].source, srcs[1]);
	} else if (srcs.length === 3) {
		/* StringTemplate ::=
			| TEMPLATE_HEAD Expression              TEMPLATE_TAIL
			| TEMPLATE_HEAD StringTemplate__0__List TEMPLATE_TAIL
		; */
		assert_arrayLength(tpl.children, 3);
		assert.strictEqual(tpl.children[2].source, srcs[2]);
		return (tpl.children[1] instanceof PARSENODE.ParseNodeExpression)
			? assert.strictEqual(tpl.children[1].source, srcs[1])
			: templateMiddleSources(tpl.children[1], ...srcs.slice(1, -1) as NonemptyArray<string>)
		;
	} else {
		/* StringTemplate ::=
			| TEMPLATE_HEAD            StringTemplate__0__List TEMPLATE_TAIL
			| TEMPLATE_HEAD Expression StringTemplate__0__List TEMPLATE_TAIL
		; */
		assert.strictEqual(
			tpl.children[tpl.children.length - 1].source, // COMBAK tpl.children.lastItem
			srcs        [srcs        .length - 1],        // COMBAK srcs        .lastItem
		);
		if (tpl.children.length === 3) {
			assert.ok(tpl.children[1] instanceof PARSENODE.ParseNodeStringTemplate__0__List);
			return templateMiddleSources(tpl.children[1], ...srcs.slice(1, -1) as NonemptyArray<string>);
		} else {
			assert_arrayLength(tpl.children, 4);
			assert.strictEqual(tpl.children[1].source, srcs[1]);
			return templateMiddleSources(tpl.children[2], ...srcs.slice(2, -1) as NonemptyArray<string>);
		};
	};
}
function templateMiddleSources(tpl: PARSENODE.ParseNodeStringTemplate__0__List, ...srcs: Readonly<NonemptyArray<string>>): void {
	if (srcs.length === 1) {
		/* StringTemplate__0__List ::= TEMPLATE_MIDDLE; */
		assert_arrayLength(tpl.children, 1);
		assert.strictEqual(tpl.children[0].source, srcs[0]);
	} else if (srcs.length === 2) {
		/* StringTemplate__0__List ::=
			| TEMPLATE_MIDDLE Expression
			| StringTemplate__0__List TEMPLATE_MIDDLE
		; */
		assert_arrayLength(tpl.children, 2);
		assert.strictEqual(tpl.children[1].source, srcs[1]);
		return (tpl.children[0] instanceof Token)
			? assert.strictEqual(tpl.children[0].source, srcs[0])
			: templateMiddleSources(tpl.children[0], srcs[0])
		;
	} else {
		/* StringTemplate__0__List ::=
			| StringTemplate__0__List TEMPLATE_MIDDLE
			| StringTemplate__0__List TEMPLATE_MIDDLE Expression
		; */
		assert.strictEqual(
			tpl.children[tpl.children.length - 1].source, // COMBAK tpl.children.lastItem
			srcs        [srcs        .length - 1],        // COMBAK srcs        .lastItem
		);
		if (tpl.children.length === 2) {
			assert.ok(tpl.children[0] instanceof PARSENODE.ParseNodeStringTemplate__0__List);
			return templateMiddleSources(tpl.children[0], ...srcs.slice(0, -1) as NonemptyArray<string>);
		} else {
			assert_arrayLength(tpl.children, 3);
			assert.strictEqual(
				tpl.children[tpl.children.length - 2].source,
				srcs        [srcs        .length - 2],
			);
			return templateMiddleSources(tpl.children[0], ...srcs.slice(0, -2) as NonemptyArray<string>);
		};
	};
}
