const fs = require('fs')
const util = require('util')

const gulp       = require('gulp')
const typescript = require('gulp-typescript')
// require('typescript') // DO NOT REMOVE … peerDependency of `gulp-typescript`

const tsconfig      = require('./tsconfig.json')
const typedocconfig = tsconfig.typedocOptions


function dist() {
	return gulp.src('./src/**/*.ts')
		.pipe(typescript(tsconfig.compilerOptions))
		.pipe(gulp.dest('./build/'))
}

async function test() {
	const {Scanner, Lexer, Translator, Parser} = require('./')
	const {default: Grammar} = require('./build/class/Grammar.class')
	const input = util.promisify(fs.readFile)('./test/test-v0.2.solid', 'utf8')

	console.log("\n\nHere are the characters returned by the scanner:")
	console.log("  line col  character")
	const scanner = new Scanner(await input).generate()
	let iterator_result_char = scanner.next()
	while (!iterator_result_char.done) {
		console.log(iterator_result_char.value.toString())
		iterator_result_char = scanner.next()
	}

	console.log("\n\nHere are the tokens returned by the lexer:")
	const lexer = new Lexer(await input).generate()
	let iterator_result_token = lexer.next()
	while (!iterator_result_token.done) {
		console.log(iterator_result_token.value.serialize())
		iterator_result_token = lexer.next()
	}

	console.log("\n\nHere are the tokens returned by the translator:")
	const trans_obj = new Translator(await input)
	const translator = trans_obj.generate()
	let iterator_result_tokentrans = translator.next()
	while (!iterator_result_tokentrans.done) {
		console.log(iterator_result_tokentrans.value.serialize(trans_obj))
		iterator_result_tokentrans = translator.next()
	}

	const {
		ProductionFile,
		ProductionExpression,
		ProductionExpressionAdditive,
		ProductionExpressionMultiplicative,
		ProductionExpressionExponential,
		ProductionExpressionUnarySymbol,
		ProductionExpressionUnit,
	} = require('./build/class/Production.class')
	const solid_grammar = new Grammar([
		new ProductionFile(),
		new ProductionExpression(),
		new ProductionExpressionAdditive(),
		new ProductionExpressionMultiplicative(),
		new ProductionExpressionExponential(),
		new ProductionExpressionUnarySymbol(),
		new ProductionExpressionUnit(),
	])
	console.log("\n\nThe parse tree returned by the parser is written to file: `./sample/output.xml`")
	const parser = new Parser(solid_grammar)
	let output = ''
	try {
		output = parser.parse(await input)
	} catch (err) {
		console.log(parser.viewStack().slice(-1)[0])
		throw err
	}
	fs.writeFileSync('./sample/output.xml', output.serialize(trans_obj))

	return Promise.resolve(null)
}

const build = gulp.series(dist, test)

async function random() {
	const Grammar = require('./build/class/Grammar.class.js').default
	const {
		ProductionFile,
		ProductionExpression,
		ProductionExpressionAdditive,
		ProductionExpressionMultiplicative,
		ProductionExpressionExponential,
		ProductionExpressionUnarySymbol,
		ProductionExpressionUnit,
		ProductionStringTemplate,
		ProductionStringTemplate__0__List,
		ProductionPrimitiveLiteral,
	} = require('./build/class/Production.class')
	const solid_grammar = new Grammar([
		new ProductionFile(),
		new ProductionExpression(),
		new ProductionExpressionAdditive(),
		new ProductionExpressionMultiplicative(),
		new ProductionExpressionExponential(),
		new ProductionExpressionUnarySymbol(),
		new ProductionExpressionUnit(),
		new ProductionStringTemplate(),
		new ProductionStringTemplate__0__List(),
		new ProductionPrimitiveLiteral(),
	])
	console.log(solid_grammar.rules.map((r) => r.toString()))
	console.log(solid_grammar.random().join(' ').replace(/\u000d/g, ' '))
	return Promise.resolve(null)
}


module.exports = {
	build,
		dist,
		test,
	random,
}
