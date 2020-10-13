const fs = require('fs')
const path = require('path')
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

async function postdist() {
	const {ParserEBNF: Parser, Decorator} = require('./build/ebnf/')
	const {ParseNode, Production} = require('@chharvey/parser')
	function preamble(srcpath) {
		return `
			/*----------------------------------------------------------------/
			| WARNING: Do not manually update this file!
			| It is auto-generated via
			| <${ srcpath }>.
			| If you need to make updates, make them there.
			/----------------------------------------------------------------*/
		`
	}
	const syntaxes = Promise.all([
		new Decorator().decorate(new Parser(
			await fs.promises.readFile(path.join(__dirname, './docs/spec/grammar/ebnf-syntax.ebnf'), 'utf8')
		).parse()).transform(),
		new Decorator().decorate(new Parser(
			await fs.promises.readFile(path.join(__dirname, './docs/spec/grammar/syntax.ebnf'), 'utf8')
		).parse()).transform(),
	])
	return Promise.all([
		fs.promises.writeFile(path.join(__dirname, './src/ebnf/Production.auto.ts'), `
			${ preamble('/src/parser/Production.class.ts#Production#fromJSON') }
			import {
				GrammarSymbol,
				Production,
			} from '@chharvey/parser';
			import type {
				NonemptyArray,
			} from '../types.d';
			import * as TERMINAL from './Terminal.class';
			${ (await syntaxes)[0].map((prod) => Production.fromJSON(prod)).join('') }
		`),
		fs.promises.writeFile(path.join(__dirname, './src/ebnf/ParseNode.auto.ts'), `
			${ preamble('/src/parser/ParseNode.class.ts#ParseNode#fromJSON') }
			import {
				Token,
				ParseNode,
			} from '@chharvey/parser';
			${ (await syntaxes)[0].map((prod) => ParseNode.fromJSON(prod)).join('') }
		`),
		fs.promises.writeFile(path.join(__dirname, './src/parser/Production.auto.ts'), `
			${ preamble('/src/parser/Production.class.ts#Production#fromJSON') }
			import {
				GrammarSymbol,
				Production,
			} from '@chharvey/parser';
			import type {
				NonemptyArray,
			} from '../types.d';
			import * as TERMINAL from './Terminal.class';
			${ (await syntaxes)[1].map((prod) => Production.fromJSON(prod)).join('') }
		`),
		fs.promises.writeFile(path.join(__dirname, './src/parser/ParseNode.auto.ts'), `
			${ preamble('/src/parser/ParseNode.class.ts#ParseNode#fromJSON') }
			import {
				Token,
				ParseNode,
			} from '@chharvey/parser';
			${ (await syntaxes)[1].map((prod) => ParseNode.fromJSON(prod)).join('') }
		`),
	])
}

function test() {
	return gulp.src('./test/**/*.ts')
		.pipe(mocha({
			require: 'ts-node/register',
		}))
}

async function test_dev() {
	const {Scanner} = require('@chharvey/parser');
	const {CONFIG_DEFAULT}         = require('./build/SolidConfig.js')
	const {Lexer, Screener} = require('./build/lexer/')
	const {ParserSolid: Parser} = require('./build/class/Parser.class.js');
	const {default: CodeGenerator} = require('./build/vm/Builder.class.js')

	const input = fsPromise.readFile('./sample/test-v0.2.solid', 'utf8')

	console.log("\n\nHere are the characters returned by the scanner:")
	console.log("  line col  character")
	const scanner = new Scanner(await input).generate()
	let iterator_result_char = scanner.next()
	while (!iterator_result_char.done) {
		console.log(iterator_result_char.value.serialize())
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

const build = gulp.parallel(gulp.series(dist, postdist), test)

const dev = gulp.series(dist, test_dev)

async function random() {
	const {ParserSolid, Grammar} = require('./build/parser/')
	const sample = new Grammar().random().join(' ').replace(/\u0002|\u0003/g, '') // inserted by Scanner
	console.log(sample.replace(/\u000d/g, '\u240d'))
	const parser = new ParserSolid(sample)
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
	])
}


module.exports = {
	build,
		dist,
		postdist,
		test,
	dev,
		test_dev,
	random,
}
