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
	const { Scanner, Lexer, Translator } = require('./')
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
	const translator = new Translator(await input).generate()
	let iterator_result_tokentrans = translator.next()
	while (!iterator_result_tokentrans.done) {
		if (iterator_result_tokentrans.value !== null) console.log(iterator_result_tokentrans.value.serialize())
		iterator_result_tokentrans = translator.next()
	}

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
		new ProductionPrimitiveLiteral(),
	])
	console.log(solid_grammar.rules.map((r) => `${r.production.TAGNAME} --> ${r.symbols.map((s) => s.TAGNAME || `"${s}"`).join(' ')}`))
	console.log(solid_grammar.random().join(' '))
	return Promise.resolve(null)
}


module.exports = {
	build,
		dist,
		test,
	random
}
