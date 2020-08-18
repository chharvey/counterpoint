const fsPromise = require('fs').promises

const gulp       = require('gulp')
const mocha = require('gulp-mocha')
// require('ts-node') // DO NOT REMOVE … peerDependency of `gulp-mocha`
const typescript = require('gulp-typescript')
// require('typescript') // DO NOT REMOVE … peerDependency of `gulp-typescript`

const tsconfig      = require('./tsconfig.json')
const typedocconfig = tsconfig.typedocOptions


function dist() {
	return gulp.src('./src/**/*.ts')
		.pipe(typescript(tsconfig.compilerOptions))
		.pipe(gulp.dest('./build/'))
}

function test() {
	return gulp.src('./test/**/*.ts')
		.pipe(mocha({
			require: 'ts-node/register',
		}))
}

async function test_dev() {
	const {CONFIG_DEFAULT}         = require('./build/SolidConfig.js')
	const {default: Scanner}       = require('./build/lexer/Scanner.class.js')
	const {default: Lexer}         = require('./build/lexer/Lexer.class.js')
	const {default: Screener}      = require('./build/lexer/Screener.class.js')
	const {default: Parser       } = require('./build/class/Parser.class.js')
	const {default: CodeGenerator} = require('./build/vm/Builder.class.js')

	const input = fsPromise.readFile('./sample/test-v0.2.solid', 'utf8')

	console.log("\n\nHere are the characters returned by the scanner:")
	console.log("  line col  character")
	const scanner = new Scanner(await input).generate()
	let iterator_result_char = scanner.next()
	while (!iterator_result_char.done) {
		console.log(iterator_result_char.value.toString())
		iterator_result_char = scanner.next()
	}

	console.log("\n\nHere are the tokens returned by the lexer:")
	const lexer = new Lexer(await input, CONFIG_DEFAULT).generate()
	let iterator_result_token = lexer.next()
	while (!iterator_result_token.done) {
		console.log(iterator_result_token.value.serialize())
		iterator_result_token = lexer.next()
	}

	console.log("\n\nHere are the tokens returned by the screener:")
	const screener = new Screener(await input, CONFIG_DEFAULT).generate()
	let iterator_result_screen = screener.next()
	while (!iterator_result_screen.done) {
		if (iterator_result_screen.value !== null) console.log(iterator_result_screen.value.serialize())
		iterator_result_screen = screener.next()
	}

	const tree = new Parser(await input, CONFIG_DEFAULT).parse()
	const code = new CodeGenerator(await input, CONFIG_DEFAULT).print()
	console.log("\n\nThe parse tree returned by the parser is written to file: `./sample/output.xml`")
	console.log("\n\nThe semantic tree returned by the decorator is written to file: `./sample/output-1.xml`")
	console.log("\n\nThe compiled output returned by the compiler is written to file: `./sample/output-2.wat`")

	return Promise.all([
		fsPromise.writeFile('./sample/output.xml', tree.serialize()),
		fsPromise.writeFile('./sample/output-1.xml', tree.decorate().serialize()),
		fsPromise.writeFile('./sample/output-2.wat', code),
	])
}

const build = gulp.parallel(dist, test)

const dev = gulp.series(dist, test_dev)

async function random() {
	const {Parser} = require('./')
	const {default: Grammar} = require('./build/class/Grammar.class')
	const sample = new Grammar().random().join(' ').replace(/\u0002|\u0003/g, '') // inserted by Scanner
	console.log(sample.replace(/\u000d/g, '\u240d'))
	const parser = new Parser(sample)
	let tree;
	try {
		tree = parser.parse()
	} catch (err) {
		console.log(parser.viewStack())
		throw err
	}
	return Promise.all([
		fsPromise.writeFile('./sample/output.xml', tree.serialize()),
		fsPromise.writeFile('./sample/output-1.xml', tree.decorate().serialize()),
		fsPromise.writeFile('./sample/output-2.ts', tree.decorate().compile()),
	])
}


module.exports = {
	build,
		dist,
		test,
	dev,
		test_dev,
	random,
}
