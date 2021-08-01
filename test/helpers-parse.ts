import * as assert from 'assert'
import {
	NonemptyArray,
	Filebound,
	Token,
	TokenFilebound,
	ParseNode,
} from '@chharvey/parser';
import {
	SolidConfig,
	CONFIG_DEFAULT,
} from '../src/core/index.js';
import {
	Punctuator,
	TOKEN,
	PARSER,
	ParserSolid as Parser,
} from '../src/parser/index.js';
import {
	assert_arrayLength,
} from './assert-helpers.js';



export function wordFromString(wordstring: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeWord {
	const property: PARSER.ParseNodeProperty = propertyFromString(`${ wordstring } = null`, config);
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
	const unit: PARSER.ParseNodeTypeUnit['children'][0] = typeLiteralFromString(typestring, config);
	assert.ok(unit instanceof TOKEN.TokenIdentifier, 'unit should be a TokenIdentifier');
	return unit;
}
export function primitiveTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodePrimitiveLiteral {
	const unit: PARSER.ParseNodeTypeUnit['children'][0] = typeLiteralFromString(typestring, config);
	assert.ok(unit instanceof PARSER.ParseNodePrimitiveLiteral, 'unit should be a ParseNodePrimitiveLiteral')
	return unit
}
export function keywordTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeTypeKeyword {
	const unit: PARSER.ParseNodeTypeUnit['children'][0] = typeLiteralFromString(typestring, config);
	assert.ok(unit instanceof PARSER.ParseNodeTypeKeyword, 'unit should be a ParseNodeTypeKeyword')
	return unit
}
export function entryTypeFromString(itemstring: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeEntryType | PARSER.ParseNodeEntryType_Optional {
	const tupletype: PARSER.ParseNodeTypeTupleLiteral = tupleTypeFromString(`[${ itemstring }]`, config);
	assert_arrayLength(tupletype.children, 3, 'tuple type should have 3 children');
	assert_arrayLength(tupletype.children[1].children, 1, 'items production should have 1 child');
	assert_arrayLength(tupletype.children[1].children[0].children, 1, 'item list should have 1 child');
	return tupletype.children[1].children[0].children[0];
}
export function entryTypeNamedFromString(propertystring: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeEntryType_Named | PARSER.ParseNodeEntryType_Named_Optional {
	const recordtype: PARSER.ParseNodeTypeRecordLiteral = recordTypeFromString(`[${ propertystring }]`, config);
	assert_arrayLength(recordtype.children, 3, 'record type should have 3 children');
	assert_arrayLength(recordtype.children[1].children, 1, 'properties production should have 1 child');
	assert_arrayLength(recordtype.children[1].children[0].children, 1, 'property list should have 1 child');
	return recordtype.children[1].children[0].children[0];
}
export function tupleTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeTypeTupleLiteral {
	const unit: PARSER.ParseNodeTypeUnit['children'][0] = typeLiteralFromString(typestring, config);
	assert.ok(unit instanceof PARSER.ParseNodeTypeTupleLiteral, 'unit should be a ParseNodeTypeTupleLiteral');
	return unit;
}
export function recordTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeTypeRecordLiteral {
	const unit: PARSER.ParseNodeTypeUnit['children'][0] = typeLiteralFromString(typestring, config);
	assert.ok(unit instanceof PARSER.ParseNodeTypeRecordLiteral, 'unit should be a ParseNodeTypeRecordLiteral');
	return unit;
}
function typeLiteralFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeTypeUnit['children'][0] {
	const type_unit: PARSER.ParseNodeTypeUnit = unitTypeFromString(typestring, config);
	assert_arrayLength(type_unit.children, 1, 'type unit should have 1 child');
	const unit: PARSER.ParseNodeTypeUnit['children'][0] = type_unit.children[0];
	return unit
}
export function unitTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeTypeUnit {
	const type_compound: PARSER.ParseNodeTypeCompound = compoundTypeFromString(typestring, config);
	assert_arrayLength(type_compound.children, 1, 'compound type should have 1 child');
	return type_compound.children[0];
}
function compoundTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeTypeCompound {
	const type_unary: PARSER.ParseNodeTypeUnarySymbol = unaryTypeFromString(typestring, config)
	assert_arrayLength(type_unary.children, 1, 'unary type should have 1 child')
	return type_unary.children[0]
}
export function unaryTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeTypeUnarySymbol {
	const type_intersection: PARSER.ParseNodeTypeIntersection = intersectionTypeFromString(typestring, config)
	assert_arrayLength(type_intersection.children, 1, 'intersection type should have 1 child')
	return type_intersection.children[0]
}
export function intersectionTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeTypeIntersection {
	const type_union: PARSER.ParseNodeTypeUnion = unionTypeFromString(typestring, config)
	assert_arrayLength(type_union.children, 1, 'union type should have 1 child')
	return type_union.children[0]
}
export function unionTypeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeTypeUnion {
	return typeFromString(typestring, config).children[0]
}
function typeFromString(typestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeType {
	return typeDeclarationFromSource(`type T = ${ typestring };`, config).children[3];
}
export function propertyFromString(propertystring: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeProperty {
	const record: PARSER.ParseNodeRecordLiteral = recordLiteralFromSource(`[${ propertystring }];`, config);
	assert_arrayLength(record.children, 3, 'record should have 3 children');
	assert_arrayLength(record.children[1].children, 1, 'property list should have 1 child');
	return record.children[1].children[0];
}
export function caseFromString(casestring: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeCase {
	const mapping: PARSER.ParseNodeMappingLiteral = mappingLiteralFromSource(`{${ casestring }};`, config);
	assert_arrayLength(mapping.children, 3, 'map should have 3 children');
	assert_arrayLength(mapping.children[1].children, 1, 'case list should have 1 child');
	return mapping.children[1].children[0];
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
export function tokenIdentifierFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): TOKEN.TokenIdentifier {
	const expression_unit: PARSER.ParseNodeExpressionUnit = unitExpressionFromSource(src, config)
	assert_arrayLength(expression_unit.children, 1, 'expression unit should have 1 child')
	const unit: PARSER.ParseNodeExpressionUnit['children'][0] = expression_unit.children[0];
	assert.ok(unit instanceof TOKEN.TokenIdentifier, 'unit should be a TokenIdentifier')
	return unit
}
export function primitiveLiteralFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodePrimitiveLiteral {
	const unit: PARSER.ParseNodeExpressionUnit['children'][0] = valueLiteralFromSource(src, config);
	assert.ok(unit instanceof PARSER.ParseNodePrimitiveLiteral, 'unit should be a ParseNodePrimitiveLiteral')
	return unit
}
export function stringTemplateFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeStringTemplate {
	const unit: PARSER.ParseNodeExpressionUnit['children'][0] = valueLiteralFromSource(src, config);
	assert.ok(unit instanceof PARSER.ParseNodeStringTemplate, 'unit should be a ParseNodeStringTemplate');
	return unit;
}
export function tupleLiteralFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeTupleLiteral {
	const unit: PARSER.ParseNodeExpressionUnit['children'][0] = valueLiteralFromSource(src, config);
	assert.ok(unit instanceof PARSER.ParseNodeTupleLiteral, 'unit should be a ParseNodeTupleLiteral');
	return unit;
}
export function recordLiteralFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeRecordLiteral {
	const unit: PARSER.ParseNodeExpressionUnit['children'][0] = valueLiteralFromSource(src, config);
	assert.ok(unit instanceof PARSER.ParseNodeRecordLiteral, 'unit should be a ParseNodeRecordLiteral');
	return unit;
}
export function mappingLiteralFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeMappingLiteral {
	const unit: PARSER.ParseNodeExpressionUnit['children'][0] = valueLiteralFromSource(src, config);
	assert.ok(unit instanceof PARSER.ParseNodeMappingLiteral, 'unit should be a ParseNodeMappingLiteral');
	return unit;
}
function valueLiteralFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeExpressionUnit['children'][0] {
	const expression_unit: PARSER.ParseNodeExpressionUnit = unitExpressionFromSource(src, config);
	assert_arrayLength(expression_unit.children, 1, 'expression unit should have 1 child');
	const unit: PARSER.ParseNodeExpressionUnit['children'][0] = expression_unit.children[0];
	return unit;
}
export function unitExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeExpressionUnit {
	const expression_compound: PARSER.ParseNodeExpressionCompound = compoundExpressionFromSource(src, config)
	assert_arrayLength(expression_compound.children, 1, 'compound expression should have 1 child');
	return expression_compound.children[0];
}
export function compoundExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeExpressionCompound {
	const expression_unary: PARSER.ParseNodeExpressionUnarySymbol = unaryExpressionFromSource(src, config);
	assert_arrayLength(expression_unary.children, 1, 'unary expression should have 1 child');
	return expression_unary.children[0];
}
export function unaryExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeExpressionUnarySymbol {
	const expression_exp: PARSER.ParseNodeExpressionExponential = exponentialExpressionFromSource(src, config)
	assert_arrayLength(expression_exp.children, 1, 'exponential expression should have 1 child')
	return expression_exp.children[0]
}
export function exponentialExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeExpressionExponential {
	const expression_mul: PARSER.ParseNodeExpressionMultiplicative = multiplicativeExpressionFromSource(src, config)
	assert_arrayLength(expression_mul.children, 1, 'multiplicative expression should have 1 child')
	return expression_mul.children[0]
}
export function multiplicativeExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeExpressionMultiplicative {
	const expression_add: PARSER.ParseNodeExpressionAdditive = additiveExpressionFromSource(src, config)
	assert_arrayLength(expression_add.children, 1, 'additive expression should have 1 child')
	return expression_add.children[0]
}
export function additiveExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeExpressionAdditive {
	const expression_compare: PARSER.ParseNodeExpressionComparative = comparativeExpressionFromSource(src, config)
	assert_arrayLength(expression_compare.children, 1, 'comparative expression should have 1 child')
	return expression_compare.children[0]
}
export function comparativeExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeExpressionComparative {
	const expression_eq: PARSER.ParseNodeExpressionEquality = equalityExpressionFromSource(src, config)
	assert_arrayLength(expression_eq.children, 1, 'equality expression should have 1 child')
	return expression_eq.children[0]
}
export function equalityExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeExpressionEquality {
	const expression_conj: PARSER.ParseNodeExpressionConjunctive = conjunctiveExpressionFromSource(src, config)
	assert_arrayLength(expression_conj.children, 1, 'conjunctive expression should have 1 child')
	return expression_conj.children[0]
}
export function conjunctiveExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeExpressionConjunctive {
	const expression_disj: PARSER.ParseNodeExpressionDisjunctive = disjunctiveExpressionFromSource(src, config)
	assert_arrayLength(expression_disj.children, 1, 'disjunctive expression should have 1 child')
	return expression_disj.children[0]
}
export function disjunctiveExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeExpressionDisjunctive {
	const expression: PARSER.ParseNodeExpression = expressionFromSource(src, config)
	const expression_disj: PARSER.ParseNodeExpressionDisjunctive | PARSER.ParseNodeExpressionConditional = expression.children[0]
	assert.ok(expression_disj instanceof PARSER.ParseNodeExpressionDisjunctive, 'expression_disj should be a ParseNodeExpressionDisjunctive')
	return expression_disj
}
export function conditionalExpressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeExpressionConditional {
	const expression: PARSER.ParseNodeExpression = expressionFromSource(src, config)
	const expression_cond: PARSER.ParseNodeExpressionDisjunctive | PARSER.ParseNodeExpressionConditional = expression.children[0]
	assert.ok(expression_cond instanceof PARSER.ParseNodeExpressionConditional, 'expression_cond should be a ParseNodeExpressionConditional')
	return expression_cond
}
export function expressionFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeExpression {
	const statement: PARSER.ParseNodeStatement = statementFromSource(src, config)
	assert_arrayLength(statement.children, 2, 'statment should have 2 children')
	const [expression, endstat]: readonly [PARSER.ParseNodeExpression, Token] = statement.children
	assert.ok(endstat instanceof TOKEN.TokenPunctuator)
	assert.strictEqual(endstat.source, Punctuator.ENDSTAT)
	return expression
}
export function typeDeclarationFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeDeclarationType {
	const declaration: PARSER.ParseNodeDeclaration = declarationFromSource(src, config);
	assert_arrayLength(declaration.children, 1, 'declaration should have 1 child');
	const typ_decl: PARSER.ParseNodeDeclarationVariable | PARSER.ParseNodeDeclarationType = declaration.children[0];
	assert.ok(typ_decl instanceof PARSER.ParseNodeDeclarationType);
	return typ_decl;
}
export function variableDeclarationFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeDeclarationVariable {
	const declaration: PARSER.ParseNodeDeclaration = declarationFromSource(src, config);
	assert_arrayLength(declaration.children, 1, 'declaration should have 1 child');
	const var_decl: PARSER.ParseNodeDeclarationVariable | PARSER.ParseNodeDeclarationType = declaration.children[0];
	assert.ok(var_decl instanceof PARSER.ParseNodeDeclarationVariable)
	return var_decl
}
function declarationFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeDeclaration {
	const statement: PARSER.ParseNodeStatement = statementFromSource(src, config);
	assert_arrayLength(statement.children, 1, 'statement should have 1 child');
	const declaration: Token | PARSER.ParseNodeDeclaration | PARSER.ParseNodeStatementAssignment = statement.children[0];
	assert.ok(declaration instanceof PARSER.ParseNodeDeclaration);
	return declaration;
}
export function assigneeFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeAssignee {
	const assignment: PARSER.ParseNodeStatementAssignment = assignmentFromSource(src, config);
	const assignee: PARSER.ParseNodeAssignee = assignment.children[0];
	return assignee;
}
export function assignmentFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeStatementAssignment {
	const statement: PARSER.ParseNodeStatement = statementFromSource(src, config);
	assert_arrayLength(statement.children, 1, 'statement should have 1 child');
	const assignment: Token | PARSER.ParseNodeDeclaration | PARSER.ParseNodeStatementAssignment = statement.children[0];
	assert.ok(assignment instanceof PARSER.ParseNodeStatementAssignment);
	return assignment;
}
export function statementFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeStatement {
	const goal: PARSER.ParseNodeGoal = goalFromSource(src, config);
	assert_arrayLength(goal.children, 3, 'goal should have 3 children')
	const [sot, stat_list, eot]: readonly [Token, PARSER.ParseNodeGoal__0__List, Token] = goal.children
	assert.ok(sot instanceof TokenFilebound)
	assert.ok(eot instanceof TokenFilebound)
	assert.strictEqual(sot.source, Filebound.SOT)
	assert.strictEqual(eot.source, Filebound.EOT)
	assert_arrayLength(stat_list.children, 1, 'statement list should have 1 child')
	return stat_list.children[0]
}
export function goalFromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): PARSER.ParseNodeGoal {
	return new Parser(src, config).parse();
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



export function templateSources(tpl: PARSER.ParseNodeStringTemplate, ...srcs: Readonly<NonemptyArray<string>>): void {
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
		return (tpl.children[1] instanceof PARSER.ParseNodeExpression)
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
			assert.ok(tpl.children[1] instanceof PARSER.ParseNodeStringTemplate__0__List);
			return templateMiddleSources(tpl.children[1], ...srcs.slice(1, -1) as NonemptyArray<string>);
		} else {
			assert_arrayLength(tpl.children, 4);
			assert.strictEqual(tpl.children[1].source, srcs[1]);
			return templateMiddleSources(tpl.children[2], ...srcs.slice(2, -1) as NonemptyArray<string>);
		};
	};
}
function templateMiddleSources(tpl: PARSER.ParseNodeStringTemplate__0__List, ...srcs: Readonly<NonemptyArray<string>>): void {
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
			assert.ok(tpl.children[0] instanceof PARSER.ParseNodeStringTemplate__0__List);
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
