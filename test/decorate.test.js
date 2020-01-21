const {TokenFilebound} = require('../build/class/Token.class.js')
const {default: Parser} = require('../build/class/Parser.class.js')
const {default: Grammar} = require('../build/class/Grammar.class.js')
const {
	ProductionFile,
	ProductionExpression,
	ProductionExpressionAdditive,
	ProductionExpressionMultiplicative,
	ProductionExpressionExponential,
	ProductionExpressionUnarySymbol,
	ProductionExpressionUnit,
} = require('../build/class/Production.class')

const grammar = new Grammar([
	ProductionFile.instance,
	ProductionExpression.instance,
	ProductionExpressionAdditive.instance,
	ProductionExpressionMultiplicative.instance,
	ProductionExpressionExponential.instance,
	ProductionExpressionUnarySymbol.instance,
	ProductionExpressionUnit.instance,
])



test('Decorate empty file.', () => {
	const node = new Parser(grammar).parse('')
	expect(node.decorate().tagname).toBe('Null')
})



test('Decorate file with single token.', () => {
	const node = new Parser(grammar).parse('42')
	expect(node.decorate().serialize()).toBe(`
<Goal source=\"␂ 42 ␃\">
	<Constant line="1" col="1" source="42" value="42"></Constant>
</Goal>
	`.replace(/\n\t*/g, ''))
	const tree = new Parser(grammar).parse('')
	expect(tree.tagname).toBe('File')
	expect(tree.children.length).toBe(2)
	tree.children.forEach((child) => expect(child).toEqual(expect.any(TokenFilebound)))
})



test('Decorate unary symbol.', () => {
	const node = new Parser(grammar).parse('- 42').children[1]
	expect(node.decorate().serialize()).toBe(`
<Expression line="1" col="1" source="- 42" operator="-">
	<Constant line="1" col="3" source="42" value="42"></Constant>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test('Decorate exponential.', () => {
	const node = new Parser(grammar).parse('2 ^ -3').children[1]
	expect(node.decorate().serialize()).toBe(`
<Expression line="1" col="1" source="2 ^ -3" operator="^">
	<Constant line="1" col="1" source="2" value="2"></Constant>
	<Constant line="1" col="5" source="-3" value="-3"></Constant>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test('Decorate multiplicative.', () => {
	const node = new Parser(grammar).parse('2 * -3').children[1]
	expect(node.decorate().serialize()).toBe(`
<Expression line="1" col="1" source="2 * -3" operator="*">
	<Constant line="1" col="1" source="2" value="2"></Constant>
	<Constant line="1" col="5" source="-3" value="-3"></Constant>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test('Decorate additive.', () => {
	const node = new Parser(grammar).parse('2 + -3').children[1]
	expect(node.decorate().serialize()).toBe(`
<Expression line="1" col="1" source="2 + -3" operator="+">
	<Constant line="1" col="1" source="2" value="2"></Constant>
	<Constant line="1" col="5" source="-3" value="-3"></Constant>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test('Decorate grouping.', () => {
	const node = new Parser(grammar).parse('(2 + -3)').children[1]
	expect(node.decorate().serialize()).toBe(`
<Expression line="1" col="2" source="2 + -3" operator="+">
	<Constant line="1" col="2" source="2" value="2"></Constant>
	<Constant line="1" col="6" source="-3" value="-3"></Constant>
</Expression>
	`.replace(/\n\t*/g, ''))
})
